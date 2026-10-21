import json, pathlib, urllib.request, concurrent.futures
base='https://image.static.ooc.ai/'
p='pFH7KJlqym-GGENSoa-AX7LhJTk3Cqp/'
rows=[
('69f414d90abbab6f6a2c8131','Lumencia Academy','31.9M','OOC',p+'a5807fc4-3d2b-46cf-b361-f4ae6356b974_w600.webp','Fantasy'),
('6a4e5ec698ec239521a0cd58','Reincarnated With an OP Skill','13.5M','Nuzelle','rYjDHPAwkK-GGENgL2LgdSAMOKRyijs/4fade230-2bee-40ec-9c22-5c696c7e5d53_w600.webp','Fantasy'),
('6aaad8746c080a5d3ff0402a','APEX Heroes Academy','2.2M','GlizzyMaster','rcxfL2kIzY-GGENc0H2Nni4YbMRCxQl/90cff1f3-55be-4453-a5f7-4e33bf7f18b0_w600.webp','Fantasy'),
('69f4159703e610e05a6e7132','Hero Academia','17.3M','OOC',p+'0ccbb6c9-3682-48a8-9953-3d09f3eac5c1_q70_w600.webp','Fan Fiction'),
('6ab70e13499de207c7ca13c4','Dating the Strongest Hero','625.1K','PizzaEater9','tTdGtSYxyy-GGENYnAwJn8XyheoJknu/0eeb07b1-59f9-49eb-9d75-b32e4fc655c3_w600.webp','Romance'),
('6abbc69881327f18c26b7f4d','Relic Academy','216.3K','Kaiserr431','sohUAmrQhM-GGEN_6gOASneH21uYkP9/24876e49-5ffa-431c-a059-b3dcdb0350c3_w600.webp','Fantasy'),
('6ab3b736e2e641b7fbeb6312','SOVEREIGN SA','951.5K','OOC',p+'35d1eead-4f82-4297-9ec4-b783dacbd11f_w600.webp','Fantasy'),
('6a7160a9858391cf74c351b7','My High School Romance','1.6M','OOC',p+'29d85777-2964-4756-94a0-89ea3ddebdbc_w600.webp','Romance'),
('6a29ede9fc2f1d3843ab0ff1','Isekai Gone Wrong','6.1M','DOO','qfwA2T7Arg-APENTWLLxt_y6rdICImm/b8db7f22-77e8-47bd-a3d7-677ffa2a7097_w600.webp','Fantasy'),
('6a7b5b85ef0811cd3fce9141','Titan Academy','3.4M','GlizzyMaster','rcxfL2kIzY-GGENc0H2Nni4YbMRCxQl/7f48ae2c-7c8e-41a8-8e2b-89f5a99f43dd_w600.webp','Fantasy'),
('6ac749a7ab586f53935a023d','Failed Knight of the Swordsmanship Family SA','169.2K','OOC',p+'5931d35b-e123-4a5b-a676-0d65fb5d3f7e_w600.webp','Fantasy'),
('6aa1ae317f30885c051971e5','Heros Chronicle','1.4M','OOC',p+'26d6cb6d-f6ce-4f96-a735-0213300b1207_w600.webp','Fantasy'),
('6a682d3be7a009d994f46269','Psychic Academy NOVA','5.6M','OOC',p+'dc89f874-7d86-4a22-bda0-44f8586f05f1_w600.webp','Sci-Fi'),
('6a81f1263c50172c28527573','Reincarnated With an OP Skill 2','4.1M','Nuzelle','rYjDHPAwkK-GGENgL2LgdSAMOKRyijs/898646a6-fc49-4a01-9ee5-1c4627d02ce1_w600.webp','Fantasy'),
('6ac73a3677b84ae5150dc634','Selenia Academy S','165K','OOC',p+'a1ebc5e6-9712-49c6-be52-5e10382c86da_w600.webp','Fantasy'),
('6a9eb4ee2bff4acbcad47627','The Betrayal','1.7M','Katzhen','sTHxvU6qky-GGENw6TMPofXw3lp5ogh/c6cc3f4c-a45a-489b-b79a-6c125710fbe6_w600.webp','Romance'),
('6aa72d3890166fd9cd4a4953','ISEKAI IN ANOTHER WORLD','1.1M','Mrcream','sWjACLyqcC-APENHxrlbg7rIopkO8Yc/f1147913-960e-40ea-9082-433e458c937e_w600.webp','Fantasy'),
('6aa0db090491fec4353aa871','ACADEMIA I MY HEROES','2.2M','OOC',p+'c49e7cfa-a61c-4459-9cf7-c879da388304_w600.webp','Fan Fiction'),
('6a9a76b80d0df7ffbc3ece7b','Sharing an apartment with the popular girl','251.1K','Johnnyboy','qzDprYEHpI-GGENhxCWF_WkCkOhXuoz/13003f2e-eb90-4f19-b5da-a4b2f4b0cd1f_w600.webp','Slice of Life'),
('6a5ea102d0645dcf2b90995d','Choose Your Anime Isekai','2.8M','SkyHeart','rLGLNcbmuO-GGENYhA2zWr7VwBj5Iav/777932ee-e464-4ff2-b6ea-b4d2c92d74d9_w600.webp','Fantasy'),
('6ac8605b8d7582bbfbc6f420','Hunter Academy True Education S','7','OOC',p+'2233ca01-85a2-4172-b1ac-e36926bef814_w600.webp','Fantasy'),
('6ace0472d46c5aa169a20d73','Esper City','3','OOC',p+'26a5dea5-758c-45c6-8eff-0cae82ebed7b_w600.webp','Sci-Fi'),
('6ace0479c5c35c93f7a516c7','Age of Nations','2.9K','OOC',p+'b573fb13-6113-4996-af18-ba2f308a9dfe_w600.webp','History'),
('6ace0483d46c5aa169a23008','Yoroshiku Night Classes','6.8K','OOC',p+'76588a61-7b80-4719-b80a-9fd45fa8c545_w600.webp','Horror'),
('6acdd5a22501eb5c50d886b2','Love Then Baby','2.7K','OOC',p+'5d1c44d1-7a3b-4d7f-b6ca-152215d74c2f_w600.webp','Romance'),
('6aa228b40d4a9d2697070bd5','Confudere','846','OOC',p+'039d31c2-e1ee-46dc-abe1-b083d97b2458_w600.webp','Romance'),
('6acdc6fa23f6d84a11beb11d','Salvation of a Third Party','2.5K','OOC',p+'00e13bff-8f05-4b4b-a70d-14f527f7768c_w600.webp','Romance'),
('6ab2217bfa760164cd6c2f12','I Became the Commander of the Trash Knight Order','40.7K','OOC',p+'1e819388-e840-4a3a-82c7-f3b4ee6dd042_w600.webp','Fantasy')]
data=[]
for i,(id,title,plays,author,url,genre) in enumerate(rows):
 data.append(dict(id=id,title=title,plays=plays,author=author,source=base+url,image=f'assets/cover-{i}.webp',genre=genre,original=author=='OOC'))
pathlib.Path('dist/data.json').write_text(json.dumps(data,ensure_ascii=False))
def download(d):
 try:
  urllib.request.urlretrieve(d['source'],'dist/'+d['image']);return d['title']
 except Exception as e:return str(e)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 print(list(pool.map(download,data)))
