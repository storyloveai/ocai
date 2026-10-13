// One account/session owner shared by the app and analytics dashboard.
const track = (name, properties = {}) =>
  window.storyAnalytics?.track(name, properties);
const emit = () => window.dispatchEvent(new Event("accountchange"));
const storage = {
  get(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key));
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove(key) {
    try {
      sessionStorage.removeItem(key);
    } catch {}
  },
};
const intentKey = "storylove-auth-intent";
const account = (window.storyAccount = {
  ready: false,
  loading: true,
  user: null,
  wallet: null,
  payments: false,
  error: "",
  walletError: "",
  provider: null,
  loginBusy: false,
  async api(path, body) {
    await window.accountReady;
    if (!this.client) throw Error(this.error || "登录服务暂时不可用。");
    const { data, error } = await this.client.auth.getSession();
    if (error || !data.session) throw Error("登录已过期，请重新登录。");
    const response = await fetch("/api/" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(this.provider === "netlify"
          ? {}
          : { Authorization: "Bearer " + data.session.access_token }),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20000),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw Error("服务返回异常，请稍后重试。");
    }
    if (response.status === 401) {
      this.user = null;
      this.wallet = null;
      emit();
    }
    if (!response.ok)
      throw Object.assign(Error(result.error || "请求失败，请重试。"), {
        status: response.status,
      });
    return result;
  },
  async refreshWallet() {
    if (!this.user) return;
    if (this.walletRequest) return this.walletRequest;
    const userId = this.user.id;
    this.walletRequest = (async () => {
      try {
        const wallet = await this.api("wallet");
        if (this.user?.id === userId) {
          this.wallet = wallet;
          this.walletError = "";
        }
      } catch (error) {
        if (this.user?.id === userId) this.walletError = error.message;
      } finally {
        this.walletRequest = null;
        emit();
      }
    })();
    return this.walletRequest;
  },
  async login(intent = { route: location.hash || "#profile" }) {
    await window.accountReady;
    if (this.user) return;
    if (!this.ready) throw Error(this.error || "Google 登录暂时不可用。");
    if (this.loginBusy) return;
    this.loginBusy = true;
    emit();
    storage.set(intentKey, { ...intent, created: Date.now() });
    track("login_start", { method: "google" });
    window.storyAnalytics?.beacon();
    try {
      if (this.provider === "netlify") {
        storage.set(
          "storylove-login-return",
          location.pathname === "/analytics.html" ? "analytics" : "app",
        );
        this.identity.oauthLogin("google");
        return;
      }
      const { error } = await this.client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            location.origin +
            (location.pathname === "/analytics.html" ? "/analytics.html" : "/"),
        },
      });
      if (error) throw error;
    } catch (error) {
      if (error.message === "Redirecting to OAuth provider") return;
      this.loginBusy = false;
      storage.remove(intentKey);
      emit();
      track("login_failed", { method: "google", reason: "provider_error" });
      throw Error("无法打开 Google 登录，请重试。");
    }
  },
  takeIntent() {
    if (!this.user) return null;
    const intent = storage.get(intentKey);
    storage.remove(intentKey);
    if (!intent || Date.now() - intent.created > 30 * 60 * 1000) return null;
    if (
      !/^#(?:chat\/[-\w]+|credits|profile|character|story)$/.test(
        intent.route || "",
      )
    )
      return null;
    return intent;
  },
  async logout() {
    if (this.provider === "netlify") await this.identity.logout();
    else {
      const { error } = await this.client.auth.signOut();
      if (error) throw Error("退出失败，请重试。");
    }
    this.user = null;
    this.wallet = null;
    this.walletError = "";
    storage.remove(intentKey);
    track("logout");
    emit();
  },
});
window.accountReady = (async () => {
  try {
    const response = await fetch("/api/config", {
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 401) {
      this.user = null;
      this.wallet = null;
      emit();
    }
    if (!response.ok) throw Error("账户服务暂时不可用。");
    const config = await response.json();
    account.payments = config.payments;
    account.walletMode = config.walletMode;
    if (!config.auth) throw Error("登录服务正在准备中，请稍后再试。");
    account.provider = config.auth.provider || "supabase";
    const update = (user) => {
      if (account.user?.id !== user?.id) {
        account.wallet = null;
        account.walletError = "";
      }
      account.user = user || null;
      emit();
    };
    if (account.provider === "netlify") {
      const sdk = await import("./vendor/netlify-identity.js");
      account.identity = sdk;
      const normalize = (user) =>
        user
          ? {
              ...user,
              user_metadata: user.userMetadata || { full_name: user.name },
            }
          : null;
      await sdk.handleAuthCallback();
      update(normalize(await sdk.getUser()));
      account.client = {
        auth: {
          getSession: async () => {
            await sdk.refreshSession();
            const user = normalize(await sdk.getUser());
            return { data: { session: user ? { user } : null } };
          },
        },
      };
      sdk.onAuthChange((_event, user) => {
        update(normalize(user));
        if (user) setTimeout(() => account.refreshWallet(), 0);
      });
      if (
        account.user &&
        storage.get("storylove-login-return") === "analytics"
      ) {
        storage.remove("storylove-login-return");
        location.replace("/analytics.html");
      }
    } else {
      const { createClient } = await import("./vendor/supabase.js");
      account.client = createClient(config.auth.url, config.auth.key, {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      const url = new URL(location.href);
      const code = url.searchParams.get("code");
      const oauthError = url.searchParams.has("error");
      for (const key of [
        "code",
        "error",
        "error_code",
        "error_description",
        "auth",
      ])
        url.searchParams.delete(key);
      if (code || oauthError || location.search.includes("auth="))
        history.replaceState(null, "", url);
      if (oauthError) {
        storage.remove(intentKey);
        throw Error("Google 登录未完成，请重试。");
      }
      if (code) {
        const { error } =
          await account.client.auth.exchangeCodeForSession(code);
        if (error) {
          storage.remove(intentKey);
          throw Error("登录链接已过期，请重新登录。");
        }
      }
      const { data, error } = await account.client.auth.getSession();
      if (error) throw Error("无法恢复登录，请重试。");
      update(data.session?.user);
      account.client.auth.onAuthStateChange((event, session) => {
        const changed = account.user?.id !== session?.user?.id;
        update(session?.user);
        // Never await another auth operation inside Supabase's auth callback.
        if (session?.user && (changed || event === "SIGNED_IN"))
          setTimeout(() => account.refreshWallet(), 0);
      });
    }
    account.ready = true;
    if (account.user && storage.get(intentKey))
      track("login_complete", { method: "google" });
  } catch (error) {
    account.error = error.message || "账户服务暂时不可用。";
  } finally {
    account.loading = false;
    emit();
    // Do not await this here: API calls themselves await accountReady.
    if (account.user) setTimeout(() => account.refreshWallet(), 0);
  }
})();
