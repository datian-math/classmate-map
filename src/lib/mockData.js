/**
 * Mock data for development without Supabase.
 * Used when VITE_SUPABASE_URL is not set.
 */

export const mockStudents = [
  { id: '1', name: '张三', university: '武汉大学', major: '计算机科学', province: 'hubei', city: '武汉', phone: '138xxxx1234', wechat: 'zhangsan_wx', qq: '123456789', enroll_year: 2026, class_num: '3班', message: '来了请你吃热干面！', status: 'approved' },
  { id: '2', name: '李四', university: '华中科技大学', major: '电气工程', province: 'hubei', city: '武汉', phone: '139xxxx5678', wechat: 'lisi_wx', qq: '987654321', enroll_year: 2026, class_num: '3班', message: '光谷的火锅欢迎你', status: 'approved' },
  { id: '3', name: '王五', university: '武汉大学', major: '法学', province: 'hubei', city: '武汉', phone: '137xxxx9012', wechat: 'wangwu_wx', enroll_year: 2026, class_num: '5班', message: '珞珈山下等你', status: 'approved' },
  { id: '4', name: '赵六', university: '三峡大学', major: '水利工程', province: 'hubei', city: '宜昌', phone: '136xxxx3456', wechat: 'zhaoliu_wx', enroll_year: 2026, class_num: '2班', message: '三峡大坝走起', status: 'approved' },
  { id: '5', name: '钱七', university: '郑州大学', major: '医学', province: 'henan', city: '郑州', phone: '135xxxx7890', wechat: 'qianqi_wx', enroll_year: 2026, class_num: '3班', message: '胡辣汤安排上', status: 'approved' },
  { id: '6', name: '孙八', university: '河南大学', major: '历史学', province: 'henan', city: '开封', phone: '134xxxx1234', wechat: 'sunba_wx', enroll_year: 2026, class_num: '1班', message: '来开封看菊花', status: 'approved' },
  { id: '7', name: '周九', university: '中山大学', major: '经济学', province: 'guangdong', city: '广州', phone: '133xxxx5678', wechat: 'zhoujiu_wx', enroll_year: 2026, class_num: '4班', message: '早茶管够！', status: 'approved' },
  { id: '8', name: '吴十', university: '北京大学', major: '数学', province: 'beijing', city: '北京', phone: '132xxxx9012', wechat: 'wushi_wx', enroll_year: 2026, class_num: '3班', message: '未名湖畔见', status: 'approved' },
  { id: '9', name: '郑冬', university: '清华大学', major: '物理', province: 'beijing', city: '北京', phone: '131xxxx3456', wechat: 'zhengdong_wx', enroll_year: 2026, class_num: '5班', message: '清华园等你来', status: 'approved' },
  { id: '10', name: '陈南', university: '浙江大学', major: '计算机科学', province: 'zhejiang', city: '杭州', phone: '130xxxx7890', wechat: 'chennan_wx', enroll_year: 2026, class_num: '2班', message: '西湖边上聊聊天', status: 'approved' },
  { id: '11', name: '林北', university: '复旦大学', major: '新闻学', province: 'shanghai', city: '上海', phone: '129xxxx1234', wechat: 'linbei_wx', enroll_year: 2026, class_num: '4班', message: '外滩夜景等你', status: 'approved' },
  { id: '12', name: '黄东', university: '四川大学', major: '口腔医学', province: 'sichuan', city: '成都', phone: '128xxxx5678', wechat: 'huangdong_wx', enroll_year: 2026, class_num: '3班', message: '火锅串串安排', status: 'approved' },
  { id: '13', name: '杨西', university: '电子科技大学', major: '电子信息', province: 'sichuan', city: '成都', phone: '127xxxx9012', wechat: 'yangxi_wx', enroll_year: 2026, class_num: '1班', message: '成都欢迎你！', status: 'approved' },
]

export const mockPendingStudents = [
  { id: 'p1', name: '何新', university: '南京大学', major: '天文学', province: 'jiangsu', city: '南京', phone: '126xxxx3456', wechat: 'hexin_wx', enroll_year: 2026, class_num: '6班', message: '紫金山上看星星', status: 'pending' },
]

export const mockPosts = [
  { id: 'mp1', student_id: '1', author_name: '李四', content: '武大樱花真好看，明年一起来看！', photo_url: 'https://picsum.photos/seed/whu1/300/200', created_at: '2026-07-06T10:00:00Z' },
  { id: 'mp2', student_id: '8', author_name: '郑冬', content: '清华园的秋天太美了', photo_url: 'https://picsum.photos/seed/thu1/300/200', created_at: '2026-07-05T15:00:00Z' },
  { id: 'mp3', student_id: '12', author_name: '杨西', content: '成都火锅 yyds！', photo_url: 'https://picsum.photos/seed/cd1/300/200', created_at: '2026-07-05T12:00:00Z' },
  { id: 'mp4', student_id: '10', author_name: '陈南', content: '西湖日落', photo_url: 'https://picsum.photos/seed/hz1/300/200', created_at: '2026-07-04T18:00:00Z' },
  { id: 'mp5', student_id: '7', author_name: '周九', content: '广州早茶真的太丰富了', photo_url: null, created_at: '2026-07-04T09:00:00Z' },
  { id: 'mp6', student_id: '1', author_name: '张三', content: '热干面配蛋酒，绝了！', photo_url: 'https://picsum.photos/seed/whu2/300/200', created_at: '2026-07-03T08:00:00Z' },
  { id: 'mp7', student_id: '5', author_name: '钱七', content: '郑州的胡辣汤，冬天来一碗暖和', photo_url: null, created_at: '2026-07-03T07:30:00Z' },
  { id: 'mp8', student_id: '11', author_name: '林北', content: '外滩夜景太美了', photo_url: 'https://picsum.photos/seed/sh1/300/200', created_at: '2026-07-02T20:00:00Z' },
  { id: 'mp9', student_id: '2', author_name: '王五', content: '华科的光谷步行街逛不完', photo_url: null, created_at: '2026-07-02T14:00:00Z' },
  { id: 'mp10', student_id: '9', author_name: '吴十', content: '未名湖畔读书，岁月静好', photo_url: 'https://picsum.photos/seed/pku1/300/200', created_at: '2026-07-01T10:00:00Z' },
]
