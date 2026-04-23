# OpenAI版「龙虾」首次登场！不睡觉不离职，越PUA越聪明

- 公众号：新智元
- 作者：新智元
- 发布时间：2026年4月23日 08:52
- 原文链接：https://mp.weixin.qq.com/s/hfRsnvpWeMqPZQe6T7Xr6Q

## 摘要

无

## 正文

新智元报道  

编辑：好困
【新智元导读】OpenAI在ChatGPT里正式上线workspace agents，由Codex驱动，云端7×24运行，能跨数十种工具执行任务。GPTs进入退休倒计时。5月6日前免费体验。



GPTs，即将退休！

就在今天，OpenAI在ChatGPT中正式推出了「工作区智能体」（workspace agents）。

它是GPTs的全面升级版，由Codex驱动，在云端拥有独立的工作区，能存文件、跑代码、调用外部工具，还有记忆。

关键来了，你下班了，它还在干活。

有人表示，这不就是OpenAI版OpenClaw么！

	






GPTs的棺材板，钉上了



GPTs从2023年底上线到现在，最大的问题一直没解决，它本质上还是一个「高级聊天框」。

你提问它回答，关掉窗口一切归零。没有持续记忆，没有独立工作空间，更不能主动触发任务。

workspace agents彻底改了这个逻辑。

Codex给了每个Agent一个独立的云端沙盒环境，里面可以存文件、跑代码、调用已连接的应用程序。

它不是等你来问才动，你可以设定定时任务让它自己跑，也可以把它部署到Slack里，随时接手新请求。

更关键的是，这些Agent具备「进化能力」。

因为它有记忆功能，而且能在对话中被人工纠正和引导，团队用得越多、纠正越多，它就越精准。

久而久之，一个团队里最懂业务的人的经验，就沉淀成了所有人都能调用的标准化工作流。

OpenAI把这叫「把最佳实践沉淀为共享智能体」。说白了就是，你们团队最牛的那个人的脑子，现在能复制了。

至于GPTs，自然也就进入退休倒计时了。

OpenAI：我们很快会提供便捷的方式让大家把GPTs升级为workspace agents。






五个Agent，五种被替代的活法



在这次的发布中，OpenAI展示了五个内部真实场景。

从最基础的到最复杂的，一个比一个狠。

Spark，线索跟进Agent。

销售团队的这个Agent接到一条新线索后，先用Web search查这个人和公司的背景，再按团队既定的评分标准给线索打分，判断值不值得跟进。

如果值得，它直接用Gmail起草并发送第一封触达邮件，然后在Google Calendar上创建跟进提醒。

整条链路，从研究到评分到发邮件到排日程，一口气跑完，中间不需要人介入。

，时长
01:40

Scout，产品反馈路由Agent。

产品团队的Agent同时盯着三个入口，Slack频道、客服渠道、公开论坛。

零散的用户反馈进来之后，它自动做三件事，聚类相似反馈、排优先级、在Linear里创建结构化的issue工单。

Demo里展示的最终产出是一张Linear工单，下面整齐列着Issue描述、Summary分析、Evidence证据链，精确到「2026年3月11日在#product-feedback频道报告」。

以前这活需要一个PM花半天时间手动从十几个渠道里捞信息、整理表格。现在PM打开周一的第一杯咖啡时，工单已经建好了。

，时长
02:55

Slate，软件审查Agent。

IT部门的Agent审查员工的软件使用申请，核对公司批准的工具清单和安全政策，推荐下一步操作，需要的话自动提交IT工单。

整个审批流程从「找三个人签字等两天」变成了「Agent处理完弹窗让你确认」。

，时长
01:22

Tally，每周指标报告Agent。

这个Agent读取Google Sheet里的业务数据，字段精细到ARR、WAU、MAU、席位数、平均会话时长，按产品线分组计算周度指标，做周环比对比，生成可视化图表，撰写执行摘要，然后把完整报告交付给团队。

注意它挂载了三个专属技能，数据标准化、可视化工作流、执行摘要起草。它已经不再是一个通用聊天机器人了，而是一个专门训练过的数据分析员，替你出报告。

以前运营团队每周五下午的固定节目，三个小时对着Excel和PPT。现在一个Agent静默完成。

，时长
02:23

Trove，第三方风险管理Agent。

这个Agent对供应商做全面尽调。

它先从Google Drive拉取公司内部的风险评估标准表（TPRM Risk Criteria），然后用Web search逐项查供应商的制裁记录、财务状况、声誉风险信号，最后按照内部标准生成一份结构化的Google Doc评估报告。

这种活以前是合规咨询公司收六位数账单才干的事。现在一个Agent在云端默默跑完，你第二天上班直接看报告。

，时长
01:55


搭一个Agent，到底有多简单



所有这些Agent，都是在ChatGPT里用自然语言描述需求后，由AI自动搭建的。

以Trove为例，用户只打了一段话，大意是「搭一个第三方风险管理Agent，用Web search和TPRM风险研究技能做供应商尽调，参考Google Drive里的风险标准表，最终输出Google Doc报告」。

然后AI接管了整个过程。它自己列出了搭建步骤的checklist，自动挂载了三个工具，附加了tprm-risk-research技能，撰写了完整的角色指令、数据来源定义和输出格式要求，最后设置好了starter prompts。

全程不需要写一行代码。

搭建完成后，Agent可以共享给整个团队。所有人在ChatGPT里直接调用，也可以把它拉进Slack群组。

此外，为了帮助用户冷启动，OpenAI还准备了财务、销售、营销等领域的预设模板。每个模板内置了必要技能和推荐工具，改几个参数就能跑。

权限和计费



当然，掌控权还是在人手里。

管理员可以精细到每个用户组能访问什么工具、执行什么操作。敏感动作，比如修改表格、对外发邮件、新建日程，可以强制要求Agent弹窗申请权限，人工审批后才执行。

数据看板实时展示Agent的使用情况，跑了多少次、多少人在用。Compliance API让管理员对每个Agent的配置细节、版本更新和运行日志一览无余。发现异常，一键暂停。

Enterprise和Edu计划的管理员还能通过RBAC（基于角色的权限控制）来管控谁有资格搭建、使用和共享Agent。内置的安全护栏能防御prompt injection等攻击。

计费方面，5月6日之前完全免费。之后转为积分制计费。

这个时间窗口选得很精准。给企业用户一个月的免费体验期，等Agent跑进工作流之后再开始收费。到那时候想拔掉就难了。

目前支持ChatGPT Business、Enterprise、Edu和Teachers计划。



企业AI三国杀，OpenAI亮出底牌



OpenAI做企业市场不是一天两天了，ChatGPT Enterprise 2023年8月就上线了。

但之前它在B端的角色更像是一个「智能聊天工具+开发者编程助手」的组合。

workspace agents补上了最后一块拼图，一个面向所有业务人员的Agent平台。

但它的对面，站着两个巨头，护城河都够深。

Microsoft Copilot Agents。




截至2026年3月，Agent Store已经有70+预置Agent，支持A2A协议实现多Agent协同。核心优势是深度嵌入Microsoft 365全家桶，从Outlook到Word到Excel到Teams，无处不在。Copilot Studio让业务人员用自然语言就能搭建Agent。

Gemini Enterprise Agent Platform




同在今天，谷歌上线了一款企业版Agent平台，专为开发、管理、优化成千上万个Agent而设计。

它可以接入全球200+领先模型，堪称企业全栈式管理的「控制塔」。

但OpenAI打的是另一张牌——靠ChatGPT有9亿周活用户。

对企业来说，推Agent最大的成本从来不是技术部署，是员工培训。微软要教员工用Copilot Studio，Google要教员工用Agentspace Builder。

OpenAI的逻辑是，你的员工已经会用ChatGPT了，workspace agents就在ChatGPT侧边栏里，零学习成本。

不过，OpenAI的Agent能不能真正在这些企业级场景里站住脚，还要看跨工具执行的可靠性和企业级治理能力能否经受住真实生产环境的考验。

但方向已经摆在台面上了。2026年下半年，企业AI的三国杀会越打越凶。



你的工位还在吗



回到最开始那个问题。

在Demo中，销售团队用Spark替代了「拼凑客户信息+手动发邮件」的活，产品团队用Scout替代了「整理用户反馈+建工单」的活，运营团队用Tally替代了「做周报」的活，合规团队用Trove替代了「供应商尽调」的活。

而且，workspace agents的设计哲学不是「帮你干活」，是「替你干活」。

它有自己的工位，云端沙盒。有自己的工具箱，跨数十种应用。有自己的记忆，越用越聪明。你在Slack里@它一下，它就开始干。设个定时任务，它周五自动交报告。

你下班了，它还在。而且它不请假，不摸鱼，不要年终奖。

你猜你老板看到之后，会不会打开ChatGPT试一试？

参考资料：

https://openai.com/index/introducing-workspace-agents-in-chatgpt/ 
https://openai.com/business/workspace-agents/ 
https://x.com/OpenAI/status/2047008987665809771


秒追ASI
⭐点赞、转发、在看一键三连⭐
点亮星标，锁定新智元极速推送！

## 图片

1. https://mmbiz.qpic.cn/mmbiz_jpg/Rvq8Ow69CYUzWanaKkGoUxVPUickDfFG52xVMGG8zkPkxqU9fkRAafNFO9arnRO65XcH82JKwUBibwyfgswemQUXARXqibzg67mrM8Eh7opZIU/640?wx_fmt=jpeg&from=appmsg&watermark=1#imgIndex=0
2. https://mmbiz.qpic.cn/mmbiz_png/Rvq8Ow69CYWRQELHpkXTbONxk9XDvjsOWpaqRm5sY7NJJX1kD6X70Aib2RTYEpTS5u0Lp07ia0W0jtelEwzyScSHmLLuvQc6tjOxI9YaznjsY/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=1
3. https://mmbiz.qpic.cn/sz_mmbiz_png/Rvq8Ow69CYVSSJxNqWBXlmTMRqIVIOOK9YmAZbX7nCcByYZDMbgfwCO3zDiakgiaRVItSVGPPpI2qGb4pLbSj68OR0iaicibenUIlD1OnnaLibGZQ/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=2
4. https://mmbiz.qpic.cn/mmbiz_png/Rvq8Ow69CYWtrlEzbC9NXQN2Y4ju8THJgUstp5CbbzoUq9ajfr2zCV3NamSYBDicBdjbFCXIyF1C7Y4Ph9jE58aQZ025FghPr5u2nXNzMnhk/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=3
5. https://mmbiz.qpic.cn/sz_mmbiz_png/UicQ7HgWiaUb3uEdSPKrwGNmZEOaaGyzVvZ8dTtE9jU1rFsda3llYbCZpmWfiazUYjWBLTGvlPpXucH8Q0lEUJN3Q/640?wx_fmt=png&from=appmsg#imgIndex=4
6. https://mmbiz.qpic.cn/sz_mmbiz_png/Rvq8Ow69CYXX48EicvQqibNbM1CLjF36LpMSydlsZKPIJj2dTyl5wPrasmKE2AZgSazibOWqgibBuXFrkVNk5ESDOX7RVdQ9BBW4SwNgv7t3QTU/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=5
7. https://mmbiz.qpic.cn/sz_mmbiz_png/UicQ7HgWiaUb3uEdSPKrwGNmZEOaaGyzVvZ8dTtE9jU1rFsda3llYbCZpmWfiazUYjWBLTGvlPpXucH8Q0lEUJN3Q/640?wx_fmt=png&from=appmsg#imgIndex=6
8. https://mmbiz.qpic.cn/sz_mmbiz_png/Rvq8Ow69CYWjy5Bia7t1PxZYGTJzUtXAVW5RKXUb30ZQSwK2dzUNEulnEHIb0qfxd9icmOFWGh3BGOP9zuGZE1kPmIOhlQmEgTBnySXEkxsBE/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=7
9. https://mmbiz.qpic.cn/sz_mmbiz_png/UicQ7HgWiaUb3uEdSPKrwGNmZEOaaGyzVvZ8dTtE9jU1rFsda3llYbCZpmWfiazUYjWBLTGvlPpXucH8Q0lEUJN3Q/640?wx_fmt=png&from=appmsg#imgIndex=8
10. https://mmbiz.qpic.cn/sz_mmbiz_png/UicQ7HgWiaUb351381bTy5MO2IN89mV41M88GEiaCCibDxJoaQjYV6HfRtafnmEmfM3R1p0tmkHgBOVuXBD6UJKpsQ/640?wx_fmt=png&from=appmsg#imgIndex=9
11. https://mmbiz.qpic.cn/sz_mmbiz_png/UicQ7HgWiaUb3uEdSPKrwGNmZEOaaGyzVvZ8dTtE9jU1rFsda3llYbCZpmWfiazUYjWBLTGvlPpXucH8Q0lEUJN3Q/640?wx_fmt=png&from=appmsg#imgIndex=10
12. https://mmbiz.qpic.cn/mmbiz_png/Rvq8Ow69CYUJPqZgx8T70A9lBMssGGnFjEyIVED0mtm9wiarEdlLvzHh9YElLRANxq0Fs8rJFmSvmun9NP08ILoYOiaaJlGibic337MqJaNIAl4/640?wx_fmt=png&from=appmsg&watermark=1#imgIndex=11
13. https://mmbiz.qpic.cn/sz_mmbiz_png/UicQ7HgWiaUb3uEdSPKrwGNmZEOaaGyzVvZ8dTtE9jU1rFsda3llYbCZpmWfiazUYjWBLTGvlPpXucH8Q0lEUJN3Q/640?wx_fmt=png&from=appmsg#imgIndex=12
14. https://mmbiz.qpic.cn/mmbiz_jpg/Rvq8Ow69CYWA7YMMnthiauHV4rqvocXeHcuONIGkOJt9GaY8Lnrsicmb22m4e6tLTKZTqBhOYXMb6nFprudk0QvVybZot5Y7gXcFtbICw92VY/640?wx_fmt=jpeg&from=appmsg&watermark=1#imgIndex=13
15. https://mmbiz.qpic.cn/mmbiz_jpg/Rvq8Ow69CYWuoG0ZicHrbrC6sKzzN2f4IyVS7AD2PBWI2z4ykAP3ViaEq7sCnwX2XnEvcHQ2voUMXLfSiblbftPWDrdBRwpZbCalFQQxhMCojs/640?wx_fmt=jpeg&from=appmsg&watermark=1#imgIndex=14

## 视频

1. https://mpvideo.qpic.cn/0bc3kmbiiaacl4ao4qplbjuveu6dqrjqfbaa.f10002.mp4?dis_k=3f4c0de3bb3f17543f5f2174c8a5a94b&dis_t=1776908397&play_scene=10120&auth_info=R9eOhVwWVGDIluK4XXdcMkVSdTEVU0N9IGBfZxNGMwp9N2tETGJuQTVkMhViYhg6SAdxPQtvayhpOwU6SF8/R38=&auth_key=8bc03b1d68e28708768c9991bd9c406f&vid=wxv_4484758642088624133&format_id=10002&support_redirect=0&mmversion=false
2. https://mpvideo.qpic.cn/0b2e2idgoaagf4aabopphfuvnuwdm7jamzya.f10002.mp4?dis_k=b7d3354b35ca8fe10cdd0e8a218bc950&dis_t=1776908397&play_scene=10120&auth_info=NpbvgrcuRwI3wcDk6l10CmpJVnU1F1QTeHBnXzASFG1dLzNvFE4zOBY8MjRHYmFOYkQDcTkJaDstOTwFbUkNYRAt&auth_key=528cf3fed2f0181b287b4dfe670586e9&vid=wxv_4484749797090099204&format_id=10002&support_redirect=0&mmversion=false
3. https://mpvideo.qpic.cn/0b2eyydgwaagm4aagzxpa5uvnrwdnpdam2ya.f10002.mp4?dis_k=b2922adcfeb1dc57d7e5e5948ffbaf95&dis_t=1776908397&play_scene=10120&auth_info=M8X84PYoFldnwJXuvQN0CDVFU3UwSlUSLCBmCmATRDFYfzU7QE9ibUY9Zz4QPGFMPUgGcTxUaTp5aT1QPUhdPRV9&auth_key=04ebe015097166de388a9271172c8f62&vid=wxv_4484752546036187138&format_id=10002&support_redirect=0&mmversion=false
4. https://mpvideo.qpic.cn/0b2eqebi2aacc4aoinplznuvfaodrwaqfdia.f10002.mp4?dis_k=5c8d574f94ad723321cf0134f267accc&dis_t=1776908397&play_scene=10120&auth_info=QsfS1DNAVGLIkuK9VyBeMh8FdDcQX0R4czEKPEUUMQx4MWxFGzRuQzVgMhBoNRo6ElBwOw5jbC06alBhHg09QXo=&auth_key=31a04ea1d751ba114b1f1b0e68ded187&vid=wxv_4484756664272830465&format_id=10002&support_redirect=0&mmversion=false
5. https://mpvideo.qpic.cn/0bc3uaevqaajyeademxagruvtigdlcqaswaa.f10002.mp4?dis_k=505ccb3c7562074dd02213696df88c45&dis_t=1776908397&play_scene=10120&auth_info=Z/XK+fF9EQNhz5jgvwMuUTBIUyIyRgRDL3dmWzBHR2UMfmY7RxhlOUAyajASPDsVOEUGJj5YOGt6Pj0BbRxeaUF8&auth_key=cc4c46ed1656c3f721e16c0853d54ba2&vid=wxv_4484760069393563653&format_id=10002&support_redirect=0&mmversion=false

