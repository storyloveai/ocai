# 由 tools/renpy_export.py 生成，不要手改
define me = Character("陆远")
transform fig_left:
    zoom 0.67
    xalign 0.18
    yalign 1.0
transform fig_center:
    zoom 0.67
    xalign 0.5
    yalign 1.0
transform fig_right:
    zoom 0.67
    xalign 0.82
    yalign 1.0
define zhiyao = Character("夏知遥", color="#ff9db8")
define shencheng = Character("沈澄", color="#8fc7ff")
define jibai = Character("季白", color="#c7b4ff")
define zhou = Character("老周", color="#c9b48a")
define chenghang = Character("程航", color="#9fe0a8")
default rel_zhiyao_warmth = 2
default rel_zhiyao_trust = 1
default rel_zhiyao_esteem = 1
default rel_zhiyao_intimacy = 0
default rel_shencheng_warmth = 1
default rel_shencheng_trust = 1
default rel_shencheng_esteem = 1
default rel_shencheng_intimacy = 1
default rel_jibai_warmth = 1
default rel_jibai_trust = 1
default rel_jibai_esteem = 1
default rel_jibai_intimacy = 0
default rel_zhou_warmth = 2
default rel_zhou_trust = 2
default rel_zhou_esteem = 1
default rel_chenghang_warmth = 2
default rel_chenghang_trust = 2
default rel_chenghang_esteem = 1
default rumor = 0
default flag_saw_last_spring = False
default flag_joined_club = False
default flag_cheng_coffee = False
default flag_saw_reel = False
default flag_poster_sale = False
default flag_knows_mom = False
default flag_third_jibai = False
default flag_third_cheng = False
default flag_third_hang = False
default flag_zhiyao_secret = False
default flag_cheng_promise = False
default flag_reel_together = False
default flag_route_zhiyao = False
default flag_route_shencheng = False
default flag_route_jibai = False
default flag_route_none = False
default flag_z_stage = False
default flag_z_echo = False
default flag_z_week = False
default flag_z_rash = False
default flag_z_distance = False
default flag_z_screen = False
default flag_z_signed = False
default flag_z_shout = False
default flag_z_mom = False
default flag_z_photo = False
default flag_z_stay = False
default flag_z_letgo = False
default flag_z_good = False
default flag_z_normal = False
default flag_c_asked = False
default flag_c_honest = False
default flag_c_rash = False
default flag_c_cold = False
default flag_c_letters = False
default flag_c_tore = False
default flag_c_cat = False
default flag_c_umbrella = False
default flag_c_keep = False
default flag_c_sold = False
default flag_c_good = False
default flag_c_normal = False
default flag_j_search = False
default flag_j_watched = False
default flag_j_projector = False
default flag_j_once = False
default flag_j_clue = False
default flag_j_whole = False
default flag_j_good = False
default flag_j_normal = False
default grudge_zhiyao = 0
default grudge_shencheng = 0
default grudge_jibai = 0
default flag_broken_zhiyao = False
default flag_broken_shencheng = False
default flag_broken_jibai = False
default flag_z_promised = False
default flag_z_broke_promise = False
default flag_z_firstday = False
default flag_c_talked_promise = False
default flag_j_asked_end = False

label start:
    jump ch_p

label ch_p:
    centered "序章"
    # ==== p_return · 序章 · 返乡
    scene bg train with dissolve
    "三月。列车沿着海岸线往南开。窗外的海，和七年前一模一样。"
    "（七年。我以为自己不会再回来了。）"
    "父亲去世以后，律师寄来一封信：汐川的老房子归我了。还有一句话，写在信的最后——"
    "“潮声影院五月拆除。你祖父的东西，还在放映室。——老周”"
    scene bg station with dissolve
    "汐川站小得只有一个站台。风里有咸味。"
    scene bg oldhouse with dissolve
    "老房子的门锁锈了。院子里那棵枇杷树还在，比记忆里高了很多。"
    "（先去影院看看吧。趁天还没黑。）"
    scene bg cinema_dusk with dissolve
    "潮声影院是一座露天影院。白色的银幕背对着海，前面是一排排生锈的铁椅子。夕阳把银幕染成了橙色。"
    scene cg cg_stage with dissolve
    "银幕下面的台子上，站着一个女孩。她对着空无一人的座位，大声地念着什么。"
    scene bg cinema_dusk with dissolve
    show zhiyao normal at fig_center
    if (grudge_zhiyao >= 1) and (not flag_broken_zhiyao):
        "夏知遥看见你，把脸别了过去。那句话，她还记着。"
    zhiyao "……春季放映会，最后一季！每周六晚上七点，潮声影院，免费入场！——不对，太像卖菜的了。"
    show zhiyao surprised at fig_center
    zhiyao "……啊。"
    show zhiyao angry at fig_center
    zhiyao "你是拆迁办的人吧？我告诉你，五月之前，我们一天也不会搬的！"
    me "我不是拆迁办的。我姓陆。这座影院，是我爷爷开的。"
    show zhiyao surprised at fig_center
    zhiyao "……诶？"
    show zhiyao normal at fig_center
    zhiyao "陆爷爷的孙子？那你——你是来拆它的，还是来救它的？"
    menu:
        "“我只是来收拾爷爷的东西。”":
            $ rel_zhiyao_trust = max(0, min(10, rel_zhiyao_trust + (1)))
            show zhiyao sad at fig_center
            zhiyao "……这样啊。"
            show zhiyao normal at fig_center
            zhiyao "那你收拾的时候，小心点放映室。里面的东西，比你以为的要多。"
            "她跳下台子，从我身边走过，没有回头。"
            jump ch_c1
        "“……来看它最后一个春天。”":
            $ rel_zhiyao_intimacy = max(0, min(10, rel_zhiyao_intimacy + (1)))
            $ flag_saw_last_spring = True
            show zhiyao surprised at fig_center
            zhiyao "最后一个春天……"
            show zhiyao smile at fig_center
            zhiyao "这句话不错。可以借我用在海报上吗？"
            "她笑起来的时候，夕阳刚好落进海里。"
            jump ch_c1
        "“……先说你是谁？”":
            $ rel_zhiyao_warmth = max(0, min(10, rel_zhiyao_warmth + (1)))
            show zhiyao normal at fig_center
            zhiyao "我？夏知遥，汐川大学电影社社长。"
            show zhiyao smile at fig_center
            zhiyao "社员嘛……目前，一个。就是我。"
            jump ch_c1

label ch_c1:
    centered "第一章 · 电影社"
    # ==== c1_fair · 社团招新
    scene bg campus with dissolve
    "转学到汐川大学的第一天，室友程航就把我拖到了社团招新的广场上。"
    show chenghang normal at fig_left
    show chenghang normal at fig_left
    chenghang "听我的，大三转学生想融入，只有一条路：社团。尤其是女生多的社团。"
    show chenghang normal at fig_left
    chenghang "那个摊位就不行了，你看，只有一个人。"
    hide chenghang
    "最角落的摊位上，摆着一台老式放映机，一张手画的海报：《春季放映会 · 最后一季》。摊位后面坐着的，是昨天那个女孩。"
    show zhiyao surprised at fig_center
    if (grudge_zhiyao >= 1) and (not flag_broken_zhiyao):
        "夏知遥看见你，把脸别了过去。那句话，她还记着。"
    show zhiyao surprised at fig_center
    zhiyao "啊，陆爷爷的孙子！你也是这个学校的？"
    show zhiyao smile at fig_center
    zhiyao "太好了。听着，电影社再招不到两个人，学期末就要被撤销了。你来，就还差一个。"
    if not flag_broken_jibai:
        show jibai normal at fig_right
    if (grudge_jibai >= 1) and (not flag_broken_jibai):
        "季白对你点了点头，客气得像对一个陌生人。"
    if not flag_broken_jibai:
        show jibai normal at fig_right
        jibai "知遥，放映机的片门我调好了。下周六可以用。"
    show zhiyao normal at fig_center
    zhiyao "这是季白，研究生，影院的放映员。"
    if not flag_broken_jibai:
        show jibai normal at fig_right
        jibai "我不是社员。我是被雇来的。……你好，陆同学。"
    "一个端着托盘的女孩从摊位前走过，停下了。托盘上是几杯外送的咖啡。"
    hide jibai
    if not flag_broken_shencheng:
        show shencheng normal at fig_right
    if (grudge_shencheng >= 1) and (not flag_broken_shencheng):
        "沈澄看了你一眼，又低下头去忙手里的事，一句话也没说。"
    if not flag_broken_shencheng:
        show shencheng surprised at fig_right
        shencheng "……陆远。"
    if not flag_broken_shencheng:
        show shencheng normal at fig_right
        shencheng "回来了啊。"
    "（沈澄。七年没见，她一眼就认出了我。）"
    if not flag_broken_shencheng:
        show shencheng normal at fig_right
        shencheng "我还要送咖啡。"
    hide shencheng
    show zhiyao normal at fig_center
    zhiyao "认识的人？……先不管这个。所以，你入不入社？"
    menu:
        "当场填表。":
            $ flag_joined_club = True
            $ rel_zhiyao_intimacy = max(0, min(10, rel_zhiyao_intimacy + (1)))
            $ rel_zhiyao_esteem = max(0, min(10, rel_zhiyao_esteem + (1)))
            show zhiyao surprised at fig_center
            zhiyao "真的？！"
            show zhiyao smile at fig_center
            zhiyao "好，陆远，从今天起你就是电影社的第二个社员。工作很多的，你别后悔。"
            "她把表格收好，像是怕我反悔，又看了一遍我的名字。"
            jump sides_c1
        "说要想想，转身去追沈澄。":
            $ rel_shencheng_intimacy = max(0, min(10, rel_shencheng_intimacy + (1)))
            $ rumor = max(0, min(5, rumor + (1)))
            show zhiyao angry at fig_center
            zhiyao "……喂！"
            "我在广场的另一头追上了沈澄。她没有停下来。"
            hide zhiyao
            show shencheng normal at fig_center
            show shencheng normal at fig_center
            shencheng "有事？"
            me "……好久不见。"
            show shencheng sad at fig_center
            shencheng "七年。不是“好久”。"
            "她说完就走了。可我看见，她走到拐角时，回头看了一眼。"
            jump sides_c1
        "问季白：放映员是做什么的？" if (not flag_broken_jibai):
            $ flag_joined_club = True
            $ rel_jibai_intimacy = max(0, min(10, rel_jibai_intimacy + (1)))
            $ rel_zhiyao_warmth = max(0, min(10, rel_zhiyao_warmth + (1)))
            show jibai normal at fig_right
            show jibai normal at fig_right
            jibai "让光穿过胶片，一秒二十四格，打到银幕上。观众看见的是动，其实每一格都是停着的。"
            show jibai shy at fig_right
            jibai "……抱歉，说多了。"
            zhiyao "她一说起胶片就停不下来。所以——你入不入？"
            "我在表格上写了名字。季白在旁边看着，没说话，嘴角好像动了一下。"
            jump sides_c1

label sides_c1:
    menu:
        "放学后，你去了……"
        "雨里的海报" if not flag_broken_zhiyao:
            jump c1_poster
        "海边的咖啡馆" if not flag_broken_shencheng:
            jump c1_cafe
        "放映室" if not flag_broken_jibai:
            jump c1_booth

label c1_poster:
    # ==== c1_poster · 雨里的海报
    scene bg rain_street with dissolve
    "傍晚下起了雨。我在校门口看见夏知遥抱着一卷海报，一张一张往公告栏上贴。"
    show zhiyao normal at fig_center
    if (grudge_zhiyao >= 1) and (not flag_broken_zhiyao):
        "夏知遥看见你，把脸别了过去。那句话，她还记着。"
    show zhiyao smile at fig_center
    zhiyao "看什么？来帮忙啊，社员。"
    "我们贴完最后一张的时候，两个人都湿透了。"
    show zhiyao sad at fig_center
    zhiyao "其实我知道，就算招满了人，影院五月还是要拆。"
    show zhiyao normal at fig_center
    zhiyao "可是我想在它拆掉之前，让它再满一次。哪怕就一次。"
    menu:
        "把伞撑到她头顶。":
            $ rel_zhiyao_intimacy = max(0, min(10, rel_zhiyao_intimacy + (1)))
            scene cg cg_umbrella with dissolve
            zhiyao "……都湿透了还撑伞，你傻不傻。"
            "她没有躲开。"
            scene bg rain_street with dissolve
            jump fin
        "“那就让它满一次。我帮你。”":
            $ rel_zhiyao_trust = max(0, min(10, rel_zhiyao_trust + (1)))
            $ rel_zhiyao_esteem = max(0, min(10, rel_zhiyao_esteem + (1)))
            zhiyao "说好了啊。说话不算数的人，我会记一辈子的。"
            jump fin

label c1_cafe:
    # ==== c1_cafe · 海边的咖啡馆
    scene bg cafe with dissolve
    "沈家的咖啡馆还在海堤边上，招牌换了，门口的风铃没换。"
    show shencheng normal at fig_center
    if (grudge_shencheng >= 1) and (not flag_broken_shencheng):
        "沈澄看了你一眼，又低下头去忙手里的事，一句话也没说。"
    show shencheng normal at fig_center
    shencheng "……欢迎光临。要点什么？"
    "（她的语气，和对任何一个客人都一样。）"
    menu:
        "“热可可，多放一块棉花糖。”——小时候每次来都点这个。":
            $ rel_shencheng_intimacy = max(0, min(10, rel_shencheng_intimacy + (1)))
            $ flag_cheng_coffee = True
            show shencheng surprised at fig_center
            shencheng "……嗯。"
            "她转身去做，背对着我站了很久。端上来的时候，杯子里有两块棉花糖。"
            show shencheng sad at fig_center
            shencheng "这个你倒是记得。"
            jump fin
        "“你在生我的气？”":
            $ rel_shencheng_trust = max(0, min(10, rel_shencheng_trust + (1)))
            $ rumor = max(0, min(5, rumor + (1)))
            show shencheng normal at fig_center
            shencheng "生气？"
            show shencheng sad at fig_center
            shencheng "生气要力气的。七年，早用完了。"
            show shencheng normal at fig_center
            shencheng "……你连那天也忘了吧。"
            "（那天？哪一天？）"
            jump fin

label c1_booth:
    # ==== c1_booth · 放映室
    scene bg projection with dissolve
    "潮声影院的放映室在银幕对面的小楼上。我推门进去的时候，季白正对着灯，一格一格地看胶片。"
    show jibai normal at fig_center
    if (grudge_jibai >= 1) and (not flag_broken_jibai):
        "季白对你点了点头，客气得像对一个陌生人。"
    show jibai normal at fig_center
    jibai "陆同学。墙上那些，是你祖父的字。"
    "墙上贴满了泛黄的便签：哪台机器哪天换过灯泡，哪部片子哪一卷容易断。最下面一张写着：“第七卷，别放。”"
    show jibai normal at fig_center
    jibai "仓库里确实有一盘没有标签的胶片。我数过，它在第七个架子上。"
    show jibai sad at fig_center
    jibai "我一直没放。……因为他说别放。"
    menu:
        "“能让我看看那盘胶片吗？”":
            $ flag_saw_reel = True
            $ rel_jibai_trust = max(0, min(10, rel_jibai_trust + (1)))
            $ rel_jibai_intimacy = max(0, min(10, rel_jibai_intimacy + (1)))
            show jibai normal at fig_center
            jibai "……可以看，不可以放。"
            "那盘胶片很轻，铁盒上有一道划痕，像是有人用指甲刻下的一个数字：7。"
            jump fin
        "“你在修什么？我能帮忙吗？”":
            $ rel_jibai_warmth = max(0, min(10, rel_jibai_warmth + (1)))
            $ rel_jibai_intimacy = max(0, min(10, rel_jibai_intimacy + (1)))
            show jibai smile at fig_center
            jibai "那你帮我拿着这一头。别碰到画面。"
            "我们一直修到天黑。她讲每一格的时候，声音比白天轻快很多。"
            jump fin

label fin:
    "（小样到此结束。完整版里接下来是第二章《第一场放映》。）"
    return
