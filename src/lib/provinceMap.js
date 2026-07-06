/**
 * Province mapping utilities
 * Maps province pinyin codes to adcodes and Chinese names
 */

/** Province pinyin code -> adcode */
export const provinceAdcodeMap = {
  beijing: '110000',
  tianjin: '120000',
  hebei: '130000',
  shanxi: '140000',
  neimenggu: '150000',
  liaoning: '210000',
  jilin: '220000',
  heilongjiang: '230000',
  shanghai: '310000',
  jiangsu: '320000',
  zhejiang: '330000',
  anhui: '340000',
  fujian: '350000',
  jiangxi: '360000',
  shandong: '370000',
  henan: '410000',
  hubei: '420000',
  hunan: '430000',
  guangdong: '440000',
  guangxi: '450000',
  hainan: '460000',
  chongqing: '500000',
  sichuan: '510000',
  guizhou: '520000',
  yunnan: '530000',
  xizang: '540000',
  shaanxi: '610000',
  gansu: '620000',
  qinghai: '630000',
  ningxia: '640000',
  xinjiang: '650000',
  taiwan: '710000',
  xianggang: '810000',
  aomen: '820000',
}

/** Province pinyin code -> Chinese name */
export const provinceNameMap = {
  beijing: '北京',
  tianjin: '天津',
  hebei: '河北',
  shanxi: '山西',
  neimenggu: '内蒙古',
  liaoning: '辽宁',
  jilin: '吉林',
  heilongjiang: '黑龙江',
  shanghai: '上海',
  jiangsu: '江苏',
  zhejiang: '浙江',
  anhui: '安徽',
  fujian: '福建',
  jiangxi: '江西',
  shandong: '山东',
  henan: '河南',
  hubei: '湖北',
  hunan: '湖南',
  guangdong: '广东',
  guangxi: '广西',
  hainan: '海南',
  chongqing: '重庆',
  sichuan: '四川',
  guizhou: '贵州',
  yunnan: '云南',
  xizang: '西藏',
  shaanxi: '陕西',
  gansu: '甘肃',
  qinghai: '青海',
  ningxia: '宁夏',
  xinjiang: '新疆',
  taiwan: '台湾',
  xianggang: '香港',
  aomen: '澳门',
}

/** All province pinyin codes */
export const provinceCodes = Object.keys(provinceAdcodeMap)

/** Get adcode by province pinyin code */
export function getAdcode(code) {
  return provinceAdcodeMap[code]
}

/** Get Chinese name by province pinyin code */
export function getProvinceName(code) {
  return provinceNameMap[code]
}

/** Get the GeoJSON file path for a province */
export function getProvinceMapUrl(code) {
  return `/maps/provinces/${code}.json`
}
