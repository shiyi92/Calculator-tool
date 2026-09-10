'use strict'

const STORAGE_KEY = 'calculator-tool-projects-v1'
const SETTLEMENT_STORAGE_KEY = 'calculator-tool-settlements-v1'
const DICTIONARY_STORAGE_KEY = 'calculator-tool-dictionaries-v1'
const moneyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
const numberFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2
})
const serialCollator = new Intl.Collator('zh-CN', {
  numeric: true,
  sensitivity: 'base'
})
const BALANCE_LABOR_START_DATE = '2022-01-01'
const FORMULA_DESCRIPTIONS = {
  untaxedAmount: '合同不含税金额 = 合同含税金额 ÷ (1 + 税点 ÷ 100)',
  paidAmount: '已付款金额 = Σ付款明细金额',
  unpaidAmount: '未付款金额 = 合同含税金额 − 已付款金额',
  laborDuration: '汇总工期 = Σ工期登记天数',
  laborCost: '人工费 = Σ(人员汇总工期 × 单价)',
  laborItemAmount: '总计 = 汇总工期 × 单价',
  materialCost: '材料费 = Σ(材料使用数量 × 单价)',
  materialItemAmount: '使用金额 = 使用数量 × 单价',
  otherCost: '其它费用 = Σ费用明细金额',
  otherItemAmount: '金额 = Σ当前记录的费用明细金额',
  managementFee: '管理费 = 手工设置金额；未手工设置时为合同含税金额 × 签约公司管理费率',
  totalCost: '总费用 = 人工费 + 材料费 + 管理费 + 其它费用',
  costRatio: '费用占比 = 总费用 ÷ 合同含税金额 × 100%',
  estimatedBalance: '项目日期 ≤ 2021-12-31：预估结余 = 合同不含税金额 − 材料费 − 管理费 + 预交税费；项目日期 ≥ 2022-01-01：预估结余 = 合同不含税金额 − 人工费 − 材料费 − 管理费 + 预交税费',
  invoiceAmount: '开票金额 = Σ开票明细金额',
  invoiceRatio: '开票占比 = 开票金额 ÷ 合同含税金额 × 100%',
  paymentRatio: '付款比例 = 付款金额 ÷ 合同含税金额 × 100%',
  profit: '利润 = 合同不含税金额 − 总费用',
  grossMargin: '毛利率（含税）= 利润 ÷ 合同含税金额 × 100%',
  untaxedProfitRate: '利润率（不含税）= 利润 ÷ 合同不含税金额 × 100%',
  summaryContract: '汇总合同含税金额 = Σ项目合同含税金额',
  summaryUntaxed: '汇总不含税金额 = Σ项目合同不含税金额',
  summaryPaid: '汇总已付款金额 = Σ项目已付款金额',
  summaryUnpaid: '汇总未付款金额 = Σ项目未付款金额',
  summarySettled: '已结款 = Σ结款明细金额',
  summaryUnsettled: '未结款 = Σ项目预估结余 − 已结款',
  summaryLabor: '汇总人工费 = Σ项目人工费',
  summaryMaterial: '汇总材料费 = Σ项目材料费',
  summaryOther: '汇总其它费用 = Σ项目其它费用',
  summaryManagementFee: '汇总管理费 = Σ项目管理费',
  summaryTotalCost: '汇总总费用 = Σ项目总费用',
  summaryCostRatio: '汇总费用占比 = 汇总总费用 ÷ 汇总合同含税金额 × 100%',
  summaryProfit: '汇总利润 = Σ项目利润',
  summaryGrossMargin: '汇总毛利率（含税）= 汇总利润 ÷ 汇总合同含税金额 × 100%',
  summaryUntaxedProfitRate: '汇总利润率（不含税）= 汇总利润 ÷ 汇总不含税金额 × 100%'
}
const STATIC_FORMULA_TARGETS = {
  totalContract: 'summaryContract',
  totalUntaxed: 'summaryUntaxed',
  totalPaid: 'summaryPaid',
  totalUnpaid: 'summaryUnpaid',
  totalSettled: 'summarySettled',
  totalUnsettled: 'summaryUnsettled',
  totalLabor: 'summaryLabor',
  totalMaterial: 'summaryMaterial',
  totalOther: 'summaryOther',
  totalManagementFee: 'summaryManagementFee',
  totalCost: 'summaryTotalCost',
  totalCostRatio: 'summaryCostRatio',
  totalProfit: 'summaryProfit',
  totalGrossMargin: 'summaryGrossMargin',
  totalUntaxedProfitRate: 'summaryUntaxedProfitRate',
  previewUnpaid: 'unpaidAmount',
  previewUntaxed: 'untaxedAmount',
  previewCost: 'totalCost',
  previewCostRatio: 'costRatio',
  previewBalance: 'estimatedBalance',
  paidAmountDisplay: 'paidAmount',
  laborCostDisplay: 'laborCost',
  materialCostDisplay: 'materialCost',
  managementFeeDisplay: 'managementFee',
  otherCostDisplay: 'otherCost',
  invoiceDisplay: 'invoiceAmount'
}
const TABLE_FORMULA_KEYS = {
  '不含税金额': 'untaxedAmount',
  '已付款金额': 'paidAmount',
  '未付款金额': 'unpaidAmount',
  '人工费': 'laborCost',
  '材料费': 'materialCost',
  '管理费': 'managementFee',
  '其它费用': 'otherCost',
  '总费用': 'totalCost',
  '预估结余': 'estimatedBalance',
  '开票': 'invoiceRatio',
  '利润': 'profit',
  '毛利率(含税)': 'grossMargin',
  '利润率(不含税)': 'untaxedProfitRate'
}
const DETAIL_FORMULA_KEYS = {
  '不含税金额': 'untaxedAmount',
  '已付款金额': 'paidAmount',
  '未付款金额': 'unpaidAmount',
  '人工费': 'laborCost',
  '材料费': 'materialCost',
  '其它费用': 'otherCost',
  '管理费': 'managementFee',
  '项目总费用': 'totalCost',
  '费用占比': 'costRatio',
  '利润': 'profit',
  '毛利率（含税）': 'grossMargin',
  '利润率（不含税）': 'untaxedProfitRate',
  '预估结余': 'estimatedBalance',
  '开票': 'invoiceAmount'
}

const form = document.querySelector('#projectForm')
const formTitle = document.querySelector('#formTitle')
const submitButton = document.querySelector('#submitButton')
const projectDialog = document.querySelector('#projectDialog')
const dictionaryDialog = document.querySelector('#dictionaryDialog')
const dictionaryContent = document.querySelector('#dictionaryContent')
const openDictionaryDialogButton = document.querySelector('#openDictionaryDialogButton')
const closeDictionaryDialogButton = document.querySelector('#closeDictionaryDialogButton')
const finishDictionaryDialogButton = document.querySelector('#finishDictionaryDialogButton')
const addProjectButton = document.querySelector('#addProjectButton')
const closeDialogButton = document.querySelector('#closeDialogButton')
const cancelFormButton = document.querySelector('#cancelFormButton')
const yearFilter = document.querySelector('#yearFilter')
const yearSearchButton = document.querySelector('#yearSearchButton')
const yearResetButton = document.querySelector('#yearResetButton')
const keywordSearchButton = document.querySelector('#keywordSearchButton')
const tableBody = document.querySelector('#projectTableBody')
const searchInput = document.querySelector('#searchInput')
const importFileInput = document.querySelector('#importFileInput')
const installButton = document.querySelector('#installButton')
const toast = document.querySelector('#toast')
const managementFeeDialog = document.querySelector('#managementFeeDialog')
const managementFeeForm = document.querySelector('#managementFeeForm')
const managementFeeAmountInput = managementFeeForm.querySelector('[name="amount"]')
const managementFeeDialogTitle = document.querySelector('#managementFeeDialogTitle')
const managementFeeDialogContext = document.querySelector('#managementFeeDialogContext')
const managementFeeDialogDefault = document.querySelector('#managementFeeDialogDefault')
const managementFeeDialogHint = document.querySelector('#managementFeeDialogHint')
const costDialog = document.querySelector('#costDialog')
const costItemForm = document.querySelector('#costItemForm')
const costItemFields = document.querySelector('#costItemFields')
const costDetailList = document.querySelector('#costDetailList')
const costDialogTitle = document.querySelector('#costDialogTitle')
const costDialogContext = document.querySelector('#costDialogContext')
const costDialogTotal = document.querySelector('#costDialogTotal')
const saveCostItemButton = document.querySelector('#saveCostItemButton')
const cancelCostEditButton = document.querySelector('#cancelCostEditButton')
const laborDurationDialog = document.querySelector('#laborDurationDialog')
const laborDurationForm = document.querySelector('#laborDurationForm')
const laborDurationDialogTitle = document.querySelector('#laborDurationDialogTitle')
const laborDurationDialogContext = document.querySelector('#laborDurationDialogContext')
const laborDurationDialogTotal = document.querySelector('#laborDurationDialogTotal')
const laborDurationDetailList = document.querySelector('#laborDurationDetailList')
const saveLaborDurationButton = document.querySelector('#saveLaborDurationButton')
const cancelLaborDurationEditButton = document.querySelector('#cancelLaborDurationEditButton')
const detailDialog = document.querySelector('#detailDialog')
const detailDialogTitle = document.querySelector('#detailDialogTitle')
const projectDetailContent = document.querySelector('#projectDetailContent')
const settlementDialog = document.querySelector('#settlementDialog')
const settlementForm = document.querySelector('#settlementForm')
const settlementDialogTitle = document.querySelector('#settlementDialogTitle')
const settlementDialogContext = document.querySelector('#settlementDialogContext')
const settlementDialogTotal = document.querySelector('#settlementDialogTotal')
const settlementDetailList = document.querySelector('#settlementDetailList')
const saveSettlementButton = document.querySelector('#saveSettlementButton')
const cancelSettlementEditButton = document.querySelector('#cancelSettlementEditButton')

const MATERIAL_PRODUCTS = [
  '德丽斯（组）', '贝斯', '托普（白色）', '聚酯布', '雅德丽', '柏瑞斯',
  '屋美特底漆', '屋美特表层1216', '屋美特表层1211', '固锈剂', '聚脲', '稀释剂'
]
const COMPANIES = ['长沙凯德', '苏州德莎']
const DEFAULT_DICTIONARIES = {
  companies: COMPANIES.map((value) => ({
    value,
    label: value,
    managementFeeRate: value === COMPANIES[0] ? 0.04 : 0
  })),
  materialProducts: [...MATERIAL_PRODUCTS]
}
const DICTIONARY_CONFIG = [
  { key: 'companies', label: '签约公司', placeholder: '新增公司名称' },
  { key: 'materialProducts', label: '材料产品', placeholder: '新增材料产品' }
]

const COST_CONFIG = {
  labor: {
    label: '人工费',
    detailKey: 'laborDetails',
    amountKey: 'laborCost',
    fields: [
      { name: 'name', label: '姓名', type: 'text', maxlength: 100, required: true },
      { name: 'unitPrice', label: '单价', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'durationEntries', label: '工期登记', type: 'labor-duration-details', required: true }
    ],
    columns: [
      { label: '姓名', value: (item) => item.name || '-' },
      { key: 'duration', label: '汇总工期', formulaKey: 'laborDuration', value: (item) => `${formatNumber(getLaborDuration(item))} 天` },
      { label: '单价', value: (item) => formatMoney(item.unitPrice) },
      { label: '总计', formulaKey: 'laborItemAmount', value: (item) => formatMoney(getCostItemAmount('labor', item)) }
    ]
  },
  material: {
    label: '材料费',
    detailKey: 'materialDetails',
    amountKey: 'materialCost',
    fields: [
      { name: 'product', label: '产品', type: 'select', options: () => getDictionaryValues('materialProducts'), required: true },
      { name: 'pickupQuantity', label: '拿货', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'unitPrice', label: '单价', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'usedQuantity', label: '使用', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'remainingQuantity', label: '剩余', type: 'number', min: 0, step: 0.01, required: true }
    ],
    columns: [
      { label: '产品', value: (item) => item.product || '-' },
      { label: '拿货', value: (item) => formatNumber(item.pickupQuantity) },
      { label: '单价', value: (item) => formatMoney(item.unitPrice) },
      { label: '使用', value: (item) => formatNumber(item.usedQuantity) },
      { label: '剩余', value: (item) => formatNumber(item.remainingQuantity) },
      { label: '使用金额', formulaKey: 'materialItemAmount', value: (item) => formatMoney(getCostItemAmount('material', item)) }
    ]
  },
  other: {
    label: '其它费用',
    detailKey: 'otherDetails',
    amountKey: 'otherCost',
    fields: [
      { name: 'expenseDate', label: '日期', type: 'date', required: true },
      { name: 'details', label: '费用明细', type: 'other-details', required: true },
      { name: 'payer', label: '付款人', type: 'text', maxlength: 100 },
      { name: 'note', label: '备注', type: 'textarea', maxlength: 200 }
    ],
    columns: [
      { label: '日期', value: (item) => item.expenseDate || '-' },
      { label: '明细', value: (item) => formatOtherDetails(item.details) },
      { label: '金额', formulaKey: 'otherItemAmount', value: (item) => formatMoney(getCostItemAmount('other', item)) },
      { label: '付款人', value: (item) => item.payer || '-' },
      { label: '备注', value: (item) => item.note || '-' }
    ]
  },
  invoice: {
    label: '开票',
    detailKey: 'invoiceDetails',
    amountKey: 'invoiceAmount',
    fields: [
      { name: 'invoiceDate', label: '开票时间', type: 'date', required: true },
      { name: 'amount', label: '开票金额', type: 'number', min: 0, step: 0.01, required: true }
    ],
    columns: [
      { label: '开票时间', value: (item) => item.invoiceDate || '-' },
      { label: '开票金额', value: (item) => formatMoney(item.amount) },
      { label: '开票占比', formulaKey: 'invoiceRatio', value: (item, project) => formatPercent(project?.contractAmount > 0 ? item.amount / project.contractAmount * 100 : 0) }
    ]
  },
  payment: {
    label: '已付款',
    detailKey: 'paymentDetails',
    amountKey: 'paidAmount',
    fields: [
      { name: 'paymentDate', label: '付款日期', type: 'date', required: true },
      { name: 'amount', label: '付款金额', type: 'number', min: 0, step: 0.01, required: true }
    ],
    columns: [
      { label: '付款日期', value: (item) => item.paymentDate || '-' },
      { label: '付款金额', value: (item) => formatMoney(item.amount) },
      { label: '付款比例', formulaKey: 'paymentRatio', value: (item, project) => formatPercent(project?.contractAmount > 0 ? item.amount / project.contractAmount * 100 : 0) }
    ]
  }
}

const state = {
  dictionaries: loadDictionaries(),
  projects: loadProjects(),
  settlements: loadSettlements(),
  editingId: null,
  query: '',
  yearFilter: '',
  draftDetails: createEmptyDetails(),
  draftManagement: createEmptyManagement(),
  managementContext: null,
  costType: null,
  costContext: null,
  editingCostItemId: null,
  laborDurationPersonId: null,
  editingLaborDurationId: null,
  editingSettlementId: null
}

let toastTimer
let deferredInstallPrompt

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function toText(value) {
  return value == null ? '' : String(value)
}

function normalizeDictionaryValues(values, fallback) {
  const source = Array.isArray(values) ? values : fallback
  return [...new Set(source.map((value) => toText(value).trim()).filter(Boolean))]
}

function normalizeCompanyEntry(entry) {
  const source = entry && typeof entry === 'object' ? entry : { value: entry }
  const value = toText(source.value || source.label).trim()
  if (!value) return null
  const label = toText(source.label || value).trim() || value
  const managementFeeRate = source.managementFeeRate == null || source.managementFeeRate === ''
    ? (value === COMPANIES[0] ? 0.04 : 0)
    : Math.max(0, toNumber(source.managementFeeRate))
  return { value, label, managementFeeRate }
}

function normalizeCompanyValues(values, fallback) {
  const source = Array.isArray(values) ? values : fallback
  const entries = source.map(normalizeCompanyEntry).filter(Boolean)
  const seen = new Set()
  return entries.filter((entry) => {
    if (seen.has(entry.value)) return false
    seen.add(entry.value)
    return true
  })
}

function loadDictionaries() {
  try {
    const saved = localStorage.getItem(DICTIONARY_STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : {}
    return {
      companies: normalizeCompanyValues(parsed.companies, DEFAULT_DICTIONARIES.companies),
      materialProducts: normalizeDictionaryValues(parsed.materialProducts, DEFAULT_DICTIONARIES.materialProducts)
    }
  } catch (error) {
    console.error('读取字典数据失败', error)
    return {
      companies: DEFAULT_DICTIONARIES.companies.map((company) => ({ ...company })),
      materialProducts: [...DEFAULT_DICTIONARIES.materialProducts]
    }
  }
}

function saveDictionaries() {
  try {
    localStorage.setItem(DICTIONARY_STORAGE_KEY, JSON.stringify(state.dictionaries))
  } catch (error) {
    console.error('保存字典数据失败', error)
    showToast('字典数据保存失败', true)
  }
}

function getDictionaryValues(key) {
  return state.dictionaries[key] || []
}

function getToday() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function isValidDateText(value) {
  const text = toText(value)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!match) return false
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.getFullYear() === Number(match[1])
    && date.getMonth() === Number(match[2]) - 1
    && date.getDate() === Number(match[3])
}

function resolveProjectDate(project) {
  if (isValidDateText(project.projectDate)) return project.projectDate

  const legacyYear = Math.trunc(toNumber(project.projectYear))
  if (legacyYear >= 2000 && legacyYear <= 2100) return `${legacyYear}-01-01`

  const createdDate = toText(project.createdAt).slice(0, 10)
  return isValidDateText(createdDate) ? createdDate : getToday()
}

function createEmptyDetails() {
  return {
    laborDetails: [],
    materialDetails: [],
    otherDetails: [],
    paymentDetails: [],
    invoiceDetails: []
  }
}

function createEmptyManagement() {
  return { amount: 0, manual: false, configured: true }
}

function getDefaultManagementFeeRate(company) {
  const value = toText(company).trim()
  const entry = getDictionaryValues('companies').find((item) => item.value === value)
  return entry ? entry.managementFeeRate : 0
}

function parseBoolean(value, fallback = false) {
  if (value === true || value === 1) return true
  if (['true', '1', 'yes', '是'].includes(toText(value).trim().toLowerCase())) return true
  if (value === false || value === 0) return false
  if (['false', '0', 'no', '否'].includes(toText(value).trim().toLowerCase())) return false
  return fallback
}

function normalizeDurationEntry(entry, fallbackDate = getToday()) {
  return {
    id: toText(entry.id) || createId(),
    registrationDate: isValidDateText(entry.registrationDate) ? entry.registrationDate : fallbackDate,
    days: Math.max(0, toNumber(entry.days))
  }
}

function getLaborDuration(item) {
  if (!Array.isArray(item.durationEntries)) return Math.max(0, toNumber(item.duration))
  return item.durationEntries.reduce((total, entry) => total + Math.max(0, toNumber(entry.days)), 0)
}

function cloneItems(items) {
  return items.map((item) => ({
    ...item,
    ...(Array.isArray(item.durationEntries)
      ? { durationEntries: item.durationEntries.map((entry) => ({ ...entry })) }
      : {})
  }))
}

function getCostItemAmount(type, item) {
  if (type === 'labor') return getLaborDuration(item) * Math.max(0, toNumber(item.unitPrice))
  if (type === 'material') return Math.max(0, toNumber(item.unitPrice)) * Math.max(0, toNumber(item.usedQuantity))
  if (type === 'invoice') return Math.max(0, toNumber(item.amount))
  if (type === 'payment') return Math.max(0, toNumber(item.amount))
  if (Array.isArray(item.details)) return item.details.reduce((total, detail) => total + Math.max(0, toNumber(detail.amount)), 0)
  return Math.max(0, toNumber(item.amount))
}

function normalizeOtherDetail(detail) {
  return {
    category: toText(detail.category ?? detail.name).trim(),
    amount: Math.max(0, toNumber(detail.amount))
  }
}

function formatOtherDetails(details) {
  if (!Array.isArray(details) || details.length === 0) return '-'
  return details.map((detail) => `${detail.category || '未命名'} ${formatMoney(detail.amount)}`).join('；')
}

function normalizeCostItem(type, item, fallbackDate = getToday()) {
  const id = toText(item.id) || createId()
  if (type === 'labor') {
    const durationEntries = Array.isArray(item.durationEntries)
      ? item.durationEntries.map((entry) => normalizeDurationEntry(entry, fallbackDate))
      : (Math.max(0, toNumber(item.duration)) > 0
          ? [normalizeDurationEntry({ registrationDate: fallbackDate, days: item.duration }, fallbackDate)]
          : [])
    return {
      id,
      name: toText(item.name).trim(),
      durationEntries,
      duration: getLaborDuration({ durationEntries }),
      unitPrice: Math.max(0, toNumber(item.unitPrice))
    }
  }
  if (type === 'material') {
    return {
      id,
      product: toText(item.product).trim(),
      pickupQuantity: Math.max(0, toNumber(item.pickupQuantity ?? item.pickup ?? item.receivedQuantity)),
      unitPrice: Math.max(0, toNumber(item.unitPrice)),
      usedQuantity: Math.max(0, toNumber(item.usedQuantity ?? item.used)),
      remainingQuantity: Math.max(0, toNumber(item.remainingQuantity ?? item.remaining))
    }
  }
  if (type === 'invoice') {
    return {
      id,
      invoiceDate: isValidDateText(item.invoiceDate) ? item.invoiceDate : fallbackDate,
      amount: Math.max(0, toNumber(item.amount))
    }
  }
  if (type === 'payment') {
    return {
      id,
      paymentDate: isValidDateText(item.paymentDate) ? item.paymentDate : fallbackDate,
      amount: Math.max(0, toNumber(item.amount))
    }
  }
  const expenseDate = isValidDateText(item.expenseDate) ? item.expenseDate : fallbackDate
  const details = Array.isArray(item.details)
    ? item.details.map(normalizeOtherDetail).filter((detail) => detail.category || detail.amount > 0)
    : (toText(item.category).trim() || toNumber(item.amount) > 0
        ? [normalizeOtherDetail({ category: item.category, amount: item.amount })]
        : [])
  return {
    id,
    expenseDate,
    details,
    category: details.map((detail) => detail.category).filter(Boolean).join('、'),
    amount: details.reduce((total, detail) => total + detail.amount, 0),
    payer: toText(item.payer).trim(),
    note: toText(item.note).trim()
  }
}

function normalizeCostDetails(project, type, projectDate) {
  const config = COST_CONFIG[type]
  if (Array.isArray(project[config.detailKey])) {
    return project[config.detailKey].map((item) => normalizeCostItem(type, item, projectDate))
  }

  const legacyAmount = Math.max(0, toNumber(project[config.amountKey]))
  if (legacyAmount === 0) return []
  if (type === 'labor') {
    return [normalizeCostItem(type, { name: '历史汇总', duration: 1, unitPrice: legacyAmount }, projectDate)]
  }
  if (type === 'material') {
    return [normalizeCostItem(type, {
      product: '历史汇总', unitPrice: legacyAmount, usedQuantity: 1, remainingQuantity: 0
    }, projectDate)]
  }
  if (type === 'payment') {
    return [normalizeCostItem(type, { paymentDate: projectDate, amount: legacyAmount }, projectDate)]
  }
  return [normalizeCostItem(type, { category: '历史汇总', expenseDate: projectDate, amount: legacyAmount }, projectDate)]
}

function sumCostItems(type, items) {
  return items.reduce((total, item) => total + getCostItemAmount(type, item), 0)
}

function normalizeProject(source) {
  const project = source || {}
  const projectDate = resolveProjectDate(project)
  const laborDetails = normalizeCostDetails(project, 'labor', projectDate)
  const materialDetails = normalizeCostDetails(project, 'material', projectDate)
  const otherDetails = normalizeCostDetails(project, 'other', projectDate)
  const paymentDetails = normalizeCostDetails(project, 'payment', projectDate)
  const invoiceDetails = normalizeCostDetails(project, 'invoice', projectDate)
  const paidAmount = sumCostItems('payment', paymentDetails)
  const hasManagementFeeData = [
    'managementFeeAmount', 'managementFeeManual', 'managementFeeConfigured'
  ].some((key) => Object.prototype.hasOwnProperty.call(project, key))
  const managementFeeConfigured = hasManagementFeeData
    ? parseBoolean(project.managementFeeConfigured, true)
    : false

  return {
    id: toText(project.id) || createId(),
    projectDate,
    serial: toText(project.serial).trim(),
    projectName: toText(project.projectName).trim(),
    contractAmount: Math.max(0, toNumber(project.contractAmount)),
    paidAmount,
    laborDetails,
    materialDetails,
    otherDetails,
    paymentDetails,
    invoiceDetails,
    invoiceAmount: sumCostItems('invoice', invoiceDetails),
    laborCost: sumCostItems('labor', laborDetails),
    materialCost: sumCostItems('material', materialDetails),
    otherCost: sumCostItems('other', otherDetails),
    managementFeeAmount: Math.max(0, toNumber(project.managementFeeAmount)),
    managementFeeManual: parseBoolean(project.managementFeeManual),
    managementFeeConfigured,
    prepaidTaxAmount: Math.max(0, toNumber(project.prepaidTaxAmount)),
    warrantyPeriod: toText(project.warrantyPeriod).trim(),
    invoice: toText(project.invoice).trim(),
    company: toText(project.company).trim(),
    taxRate: Math.max(0, toNumber(project.taxRate)),
    notes: toText(project.notes).trim(),
    createdAt: toText(project.createdAt) || new Date().toISOString(),
    updatedAt: toText(project.updatedAt) || new Date().toISOString()
  }
}

function normalizeSettlement(source) {
  const settlement = source || {}
  const createdDate = toText(settlement.createdAt).slice(0, 10)
  const settlementDate = isValidDateText(settlement.settlementDate)
    ? settlement.settlementDate
    : (isValidDateText(createdDate) ? createdDate : getToday())
  return {
    id: toText(settlement.id) || createId(),
    amount: Math.max(0, toNumber(settlement.amount)),
    settlementDate,
    source: toText(settlement.source).trim(),
    note: toText(settlement.note).trim(),
    createdAt: toText(settlement.createdAt) || new Date().toISOString(),
    updatedAt: toText(settlement.updatedAt) || new Date().toISOString()
  }
}

function loadSettlements() {
  try {
    const saved = localStorage.getItem(SETTLEMENT_STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.map(normalizeSettlement) : []
  } catch (error) {
    console.error('读取结款数据失败', error)
    return []
  }
}

function saveSettlements() {
  try {
    localStorage.setItem(SETTLEMENT_STORAGE_KEY, JSON.stringify(state.settlements))
  } catch (error) {
    console.error('保存结款数据失败', error)
    showToast('结款数据保存失败，请立即导出 Excel', true)
  }
}

function getSettlementYear(settlement) {
  return settlement.settlementDate.slice(0, 4)
}

function getYearFilteredSettlements() {
  const settlements = state.yearFilter
    ? state.settlements.filter((settlement) => getSettlementYear(settlement) === state.yearFilter)
    : state.settlements
  return [...settlements].sort((left, right) => right.settlementDate.localeCompare(left.settlementDate))
}

function sumSettlements(settlements) {
  return settlements.reduce((total, settlement) => total + settlement.amount, 0)
}

function loadProjects() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.map(normalizeProject) : []
  } catch (error) {
    console.error('读取本地数据失败', error)
    return []
  }
}

function saveProjects() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects))
  } catch (error) {
    console.error('保存本地数据失败', error)
    showToast('本地保存失败，请立即导出 Excel', true)
  }
}

function calculateProject(project) {
  const unpaidAmount = project.contractAmount - project.paidAmount
  const defaultManagementFee = project.contractAmount * getDefaultManagementFeeRate(project.company)
  const managementFeeAmount = !project.managementFeeConfigured
    ? 0
    : project.managementFeeManual ? project.managementFeeAmount : defaultManagementFee
  const totalCost = project.laborCost + project.materialCost + project.otherCost + managementFeeAmount
  const untaxedAmount = project.contractAmount / (1 + project.taxRate / 100)
  const laborCostForBalance = project.projectDate >= BALANCE_LABOR_START_DATE ? project.laborCost : 0
  const balance = untaxedAmount - laborCostForBalance - project.materialCost
    - managementFeeAmount + project.prepaidTaxAmount
  const costRatio = project.contractAmount > 0 ? totalCost / project.contractAmount * 100 : 0
  const profit = untaxedAmount - totalCost
  const grossMargin = project.contractAmount > 0 ? profit / project.contractAmount * 100 : 0
  const untaxedProfitRate = untaxedAmount > 0 ? profit / untaxedAmount * 100 : 0
  return {
    unpaidAmount,
    managementFeeAmount,
    totalCost,
    balance,
    untaxedAmount,
    costRatio,
    profit,
    grossMargin,
    untaxedProfitRate
  }
}

function formatMoney(value) {
  return moneyFormatter.format(toNumber(value))
}

function formatNumber(value) {
  return numberFormatter.format(toNumber(value))
}

function formatPercent(value) {
  return `${toNumber(value).toFixed(2)}%`
}

function showToast(message, isError = false) {
  clearTimeout(toastTimer)
  toast.textContent = message
  toast.classList.toggle('error', isError)
  toast.classList.add('visible')
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600)
}

function getFormulaPopover() {
  let popover = document.querySelector('#formulaPopover')
  if (popover) return popover
  popover = document.createElement('div')
  popover.id = 'formulaPopover'
  popover.className = 'formula-popover'
  popover.setAttribute('role', 'tooltip')
  popover.hidden = true
  document.body.append(popover)
  return popover
}

function hideFormulaPopover() {
  const popover = document.querySelector('#formulaPopover')
  if (popover) popover.hidden = true
}

function showFormulaPopover(button, formulaKey) {
  const formula = FORMULA_DESCRIPTIONS[formulaKey]
  if (!formula) return
  const popover = getFormulaPopover()
  popover.textContent = formula
  popover.hidden = false

  const buttonRect = button.getBoundingClientRect()
  const gap = 8
  const pagePadding = 12
  let left = buttonRect.left + buttonRect.width / 2 - popover.offsetWidth / 2
  left = Math.max(pagePadding, Math.min(left, window.innerWidth - popover.offsetWidth - pagePadding))
  let top = buttonRect.bottom + gap
  if (top + popover.offsetHeight > window.innerHeight - pagePadding) {
    top = buttonRect.top - popover.offsetHeight - gap
  }
  popover.style.left = `${left}px`
  popover.style.top = `${Math.max(pagePadding, top)}px`
}

function appendFormulaHelp(labelElement, formulaKey) {
  const formula = FORMULA_DESCRIPTIONS[formulaKey]
  if (!labelElement || !formula || labelElement.querySelector('.formula-help')) return
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'formula-help'
  button.textContent = '?'
  button.title = '查看计算公式'
  button.setAttribute('aria-label', `查看计算公式：${formula}`)
  button.addEventListener('click', (event) => {
    event.stopPropagation()
    const popover = getFormulaPopover()
    if (!popover.hidden && popover.dataset.activeFormulaKey === formulaKey) {
      hideFormulaPopover()
      popover.dataset.activeFormulaKey = ''
      return
    }
    popover.dataset.activeFormulaKey = formulaKey
    showFormulaPopover(button, formulaKey)
  })
  if (labelElement.tagName === 'TH') {
    const content = document.createElement('span')
    content.className = 'formula-header-content'
    content.append(...labelElement.childNodes)
    content.append(button)
    labelElement.append(content)
  } else {
    labelElement.classList.add('formula-label')
    labelElement.append(button)
  }
}

function initializeFormulaHelp() {
  Object.entries(STATIC_FORMULA_TARGETS).forEach(([outputId, formulaKey]) => {
    const output = document.querySelector(`#${outputId}`)
    const container = output?.closest('.summary-card') || output?.closest('.field') || output?.parentElement
    appendFormulaHelp(container?.querySelector(':scope > span'), formulaKey)
  })

  document.querySelectorAll('.records-panel thead th').forEach((header) => {
    appendFormulaHelp(header, TABLE_FORMULA_KEYS[header.textContent.trim()])
  })

  document.addEventListener('click', hideFormulaPopover)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideFormulaPopover()
  })
  window.addEventListener('resize', hideFormulaPopover)
  window.addEventListener('scroll', hideFormulaPopover, true)
}

function getControl(name) {
  return form.elements.namedItem(name)
}

function renderCompanyOptions(selectedValue = '') {
  const companyControl = getControl('company')
  if (!companyControl) return
  const value = selectedValue || companyControl.value
  companyControl.replaceChildren()
  const placeholder = document.createElement('option')
  placeholder.value = ''
  placeholder.textContent = '请选择签约公司'
  companyControl.append(placeholder)
  getDictionaryValues('companies').forEach((company) => {
    const option = document.createElement('option')
    option.value = company.value
    option.textContent = company.label
    companyControl.append(option)
  })
  if (value && !Array.from(companyControl.options).some((option) => option.value === value)) {
    ensureCompanyOption(value)
  }
  companyControl.value = value
}

function ensureCompanyOption(company) {
  const value = toText(company).trim()
  const companyControl = getControl('company')
  if (!value || !companyControl || Array.from(companyControl.options).some((option) => option.value === value)) return
  const option = document.createElement('option')
  option.value = value
  option.textContent = `${value}（历史值）`
  companyControl.append(option)
}

function parseManagementFeeRatePercent(value) {
  const text = toText(value).trim()
  if (!text) return 0
  const rate = Number(text)
  return Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate / 100 : null
}

function updateCompanyManagementFeeRate(value, input) {
  const managementFeeRate = parseManagementFeeRatePercent(input.value)
  if (managementFeeRate === null) {
    showToast('管理费率请输入 0 到 100 之间的数字', true)
    input.focus()
    return
  }
  state.dictionaries.companies = getDictionaryValues('companies').map((company) => (
    company.value === value ? { ...company, managementFeeRate } : company
  ))
  saveDictionaries()
  renderDictionaryDialog()
  showToast('管理费率已保存')
}

function addDictionaryValue(key, input, rateInput) {
  const value = input.value.trim()
  if (!value) {
    showToast('请输入字典值', true)
    input.focus()
    return
  }
  const managementFeeRate = key === 'companies'
    ? parseManagementFeeRatePercent(rateInput?.value)
    : null
  if (key === 'companies' && managementFeeRate === null) {
    showToast('管理费率请输入 0 到 100 之间的数字', true)
    rateInput.focus()
    return
  }
  const values = getDictionaryValues(key)
  const exists = key === 'companies'
    ? values.some((item) => item.value === value)
    : values.includes(value)
  if (exists) {
    showToast('该字典值已存在', true)
    input.focus()
    return
  }
  const nextValue = key === 'companies'
    ? { value, label: value, managementFeeRate }
    : value
  state.dictionaries[key] = [...values, nextValue]
  saveDictionaries()
  renderDictionaryDialog()
  renderCompanyOptions()
  showToast('字典值已新增')
}

function deleteDictionaryValue(key, value) {
  const displayValue = key === 'companies' ? value.label : value
  if (!confirm(`确定删除字典值“${displayValue}”吗？已有项目中的该值会保留为历史值。`)) return
  state.dictionaries[key] = getDictionaryValues(key).filter((item) => (
    key === 'companies' ? item.value !== value.value : item !== value
  ))
  saveDictionaries()
  renderDictionaryDialog()
  renderCompanyOptions()
  showToast('字典值已删除')
}

function renderDictionaryDialog() {
  dictionaryContent.replaceChildren()
  DICTIONARY_CONFIG.forEach(({ key, label, placeholder }) => {
    const section = document.createElement('section')
    section.className = 'dictionary-section'
    const heading = document.createElement('h3')
    heading.textContent = label
    const addRow = document.createElement('div')
    const isCompanyDictionary = key === 'companies'
    addRow.className = isCompanyDictionary
      ? 'dictionary-add-row dictionary-company-add-row'
      : 'dictionary-add-row'
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 100
    input.placeholder = placeholder
    const rateInput = isCompanyDictionary ? document.createElement('input') : null
    if (rateInput) {
      rateInput.type = 'number'
      rateInput.min = '0'
      rateInput.max = '100'
      rateInput.step = '0.01'
      rateInput.placeholder = '管理费率（%）'
    }
    const addButton = document.createElement('button')
    addButton.type = 'button'
    addButton.className = 'button button-secondary'
    addButton.textContent = '新增'
    addButton.addEventListener('click', () => addDictionaryValue(key, input, rateInput))
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') addDictionaryValue(key, input, rateInput)
    })
    addRow.append(input, ...(rateInput ? [rateInput] : []), addButton)

    const list = document.createElement('div')
    list.className = 'dictionary-value-list'
    getDictionaryValues(key).forEach((value) => {
      const item = document.createElement('div')
      item.className = 'dictionary-value-item'
      const text = document.createElement('span')
      text.textContent = isCompanyDictionary ? value.label : value
      let rateInput = null
      let saveButton = null
      if (isCompanyDictionary) {
        rateInput = document.createElement('input')
        rateInput.className = 'dictionary-rate-input'
        rateInput.type = 'number'
        rateInput.min = '0'
        rateInput.max = '100'
        rateInput.step = '0.01'
        rateInput.value = (value.managementFeeRate * 100).toFixed(2)
        saveButton = document.createElement('button')
        saveButton.type = 'button'
        saveButton.className = 'row-button'
        saveButton.textContent = '保存'
        saveButton.addEventListener('click', () => updateCompanyManagementFeeRate(value.value, rateInput))
      }
      const deleteButton = document.createElement('button')
      deleteButton.type = 'button'
      deleteButton.className = 'row-button delete'
      deleteButton.textContent = '删除'
      deleteButton.addEventListener('click', () => deleteDictionaryValue(key, value))
      item.append(text, ...(rateInput ? [rateInput, saveButton] : []), deleteButton)
      list.append(item)
    })
    section.append(heading, addRow, list)
    dictionaryContent.append(section)
  })
}

function openDictionaryDialog() {
  renderDictionaryDialog()
  dictionaryDialog.showModal()
}

function closeDictionaryDialog() {
  if (dictionaryDialog.open) dictionaryDialog.close()
}

function getProjectYear(project) {
  return project.projectDate.slice(0, 4)
}

function getYearFilteredProjects() {
  if (!state.yearFilter) return state.projects
  return state.projects.filter((project) => getProjectYear(project) === state.yearFilter)
}

function getFilteredProjects() {
  const projects = getYearFilteredProjects()
  const keyword = state.query.trim().toLocaleLowerCase('zh-CN')
  const filteredProjects = keyword ? projects.filter((project) => [
    project.projectDate,
    project.serial,
    project.projectName,
    project.company,
    project.invoice,
    project.notes
  ].some((value) => value.toLocaleLowerCase('zh-CN').includes(keyword))) : projects
  return [...filteredProjects].sort((left, right) => serialCollator.compare(left.serial, right.serial))
}

function renderYearOptions() {
  const years = [...new Set([
    String(new Date().getFullYear()),
    ...state.projects.map(getProjectYear),
    ...state.settlements.map(getSettlementYear)
  ])].sort((a, b) => Number(b) - Number(a))

  yearFilter.replaceChildren()
  const allOption = document.createElement('option')
  allOption.value = ''
  allOption.textContent = '全部年份'
  yearFilter.append(allOption)

  years.forEach((year) => {
    const option = document.createElement('option')
    option.value = year
    option.textContent = `${year} 年`
    yearFilter.append(option)
  })
  yearFilter.value = state.yearFilter
}

function renderSummary() {
  const projects = getYearFilteredProjects()
  const settlements = getYearFilteredSettlements()
  const totals = projects.reduce((result, project) => {
    const calculated = calculateProject(project)
    result.contractAmount += project.contractAmount
    result.untaxedAmount += calculated.untaxedAmount
    result.paidAmount += project.paidAmount
    result.unpaidAmount += calculated.unpaidAmount
    result.laborCost += project.laborCost
    result.materialCost += project.materialCost
    result.otherCost += project.otherCost
    result.managementFee += calculated.managementFeeAmount
    result.totalCost += calculated.totalCost
    result.profit += calculated.profit
    result.balance += calculated.balance
    return result
  }, {
    contractAmount: 0,
    untaxedAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    laborCost: 0,
    materialCost: 0,
    otherCost: 0,
    managementFee: 0,
    totalCost: 0,
    profit: 0,
    balance: 0
  })
  const settledAmount = sumSettlements(settlements)
  const unsettledAmount = totals.balance - settledAmount

  document.querySelector('#summaryTitle').textContent = state.yearFilter ? `${state.yearFilter} 年度汇总` : '全部项目汇总'
  document.querySelector('#projectCount').textContent = `${projects.length} 个项目`
  document.querySelector('#totalContract').textContent = formatMoney(totals.contractAmount)
  document.querySelector('#totalUntaxed').textContent = formatMoney(totals.untaxedAmount)
  document.querySelector('#totalPaid').textContent = formatMoney(totals.paidAmount)
  document.querySelector('#totalUnpaid').textContent = formatMoney(totals.unpaidAmount)
  document.querySelector('#totalLabor').textContent = formatMoney(totals.laborCost)
  document.querySelector('#totalMaterial').textContent = formatMoney(totals.materialCost)
  document.querySelector('#totalOther').textContent = formatMoney(totals.otherCost)
  document.querySelector('#totalManagementFee').textContent = formatMoney(totals.managementFee)
  document.querySelector('#totalCost').textContent = formatMoney(totals.totalCost)
  const totalCostRatio = totals.contractAmount > 0 ? totals.totalCost / totals.contractAmount * 100 : 0
  const totalGrossMargin = totals.contractAmount > 0 ? totals.profit / totals.contractAmount * 100 : 0
  const totalUntaxedProfitRate = totals.untaxedAmount > 0 ? totals.profit / totals.untaxedAmount * 100 : 0
  document.querySelector('#totalCostRatio').textContent = formatPercent(totalCostRatio)
  document.querySelector('#totalProfit').textContent = formatMoney(totals.profit)
  document.querySelector('#totalGrossMargin').textContent = formatPercent(totalGrossMargin)
  document.querySelector('#totalUntaxedProfitRate').textContent = formatPercent(totalUntaxedProfitRate)
  document.querySelector('#totalSettled').textContent = formatMoney(settledAmount)

  const unsettledElement = document.querySelector('#totalUnsettled')
  unsettledElement.textContent = formatMoney(unsettledAmount)
  unsettledElement.classList.toggle('negative-value', unsettledAmount < 0)
}

function createCell(label, value, className = '') {
  const cell = document.createElement('td')
  cell.dataset.label = label
  cell.textContent = value
  if (className) cell.className = className
  return cell
}

function createCostCell(project, type) {
  const config = COST_CONFIG[type]
  const cell = document.createElement('td')
  cell.dataset.label = config.label
  cell.className = 'money-cell'

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'cost-link-button'
  button.textContent = formatMoney(project[config.amountKey])
  button.title = `维护${config.label}明细`
  button.addEventListener('click', () => openCostDialog(type, { mode: 'project', projectId: project.id }))
  cell.append(button)
  return cell
}

function createManagementFeeCell(project) {
  const calculated = calculateProject(project)
  const cell = document.createElement('td')
  cell.dataset.label = '管理费'
  cell.className = 'money-cell'

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'cost-link-button'
  button.textContent = formatMoney(calculated.managementFeeAmount)
  button.title = '维护管理费'
  button.addEventListener('click', () => openManagementFeeDialog({ mode: 'project', projectId: project.id }))
  cell.append(button)
  return cell
}

function getManagementFeeProject(context) {
  if (context.mode === 'draft') return getPreviewProject()
  return state.projects.find((project) => project.id === context.projectId)
}

function applyManagementFeeUpdate(context, amount, manual) {
  if (context.mode === 'draft') {
    state.draftManagement = { amount, manual, configured: true }
    syncDraftCostDisplays()
    return
  }

  state.projects = state.projects.map((project) => project.id === context.projectId
    ? normalizeProject({
      ...project,
      managementFeeAmount: amount,
      managementFeeManual: manual,
      managementFeeConfigured: true,
      updatedAt: new Date().toISOString()
    })
    : project)
  saveProjects()
  render()
}

function closeManagementFeeDialog() {
  if (managementFeeDialog.open) managementFeeDialog.close()
}

function openManagementFeeDialog(context) {
  const project = getManagementFeeProject(context)
  if (!project) return
  const calculated = calculateProject(project)
  const defaultAmount = project.contractAmount * getDefaultManagementFeeRate(project.company)
  state.managementContext = context
  managementFeeDialogTitle.textContent = '管理费维护'
  managementFeeDialogContext.textContent = context.mode === 'draft'
    ? '当前编辑项目'
    : `${project.projectName || '项目'} · ${project.company || '未选择公司'}`
  managementFeeDialogDefault.textContent = `公司默认：${formatMoney(defaultAmount)}（${formatPercent(getDefaultManagementFeeRate(project.company) * 100)}）`
  managementFeeDialogHint.textContent = project.managementFeeManual
    ? '当前为手工金额，保存后会覆盖公司默认值。'
    : (project.managementFeeConfigured ? '当前按公司默认规则自动计算。' : '历史项目默认不计管理费，点击恢复默认后启用自动计算。')
  managementFeeAmountInput.value = calculated.managementFeeAmount.toFixed(2)
  managementFeeDialog.showModal()
}

function saveManagementFee(manual) {
  const context = state.managementContext
  if (!context || !managementFeeForm.reportValidity()) return
  const amount = Math.max(0, toNumber(managementFeeAmountInput.value))
  applyManagementFeeUpdate(context, manual ? amount : 0, manual)
  closeManagementFeeDialog()
  showToast(manual ? '管理费已保存' : '管理费已恢复默认')
}

function createInvoiceCell(project) {
  const cell = document.createElement('td')
  cell.dataset.label = '开票'
  cell.className = 'money-cell'

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'cost-link-button'
  const invoiceRatio = project.contractAmount > 0
    ? project.invoiceAmount / project.contractAmount * 100
    : 0
  button.textContent = formatPercent(invoiceRatio)
  button.title = '维护开票信息'
  button.addEventListener('click', () => openCostDialog('invoice', { mode: 'project', projectId: project.id }))
  cell.append(button)
  return cell
}

function createActionCell(project) {
  const cell = document.createElement('td')
  cell.dataset.label = '操作'
  cell.className = 'actions-cell'

  const detailButton = document.createElement('button')
  detailButton.type = 'button'
  detailButton.className = 'row-button detail'
  detailButton.textContent = '详情'
  detailButton.addEventListener('click', () => showProjectDetail(project.id))

  const editButton = document.createElement('button')
  editButton.type = 'button'
  editButton.className = 'row-button'
  editButton.textContent = '编辑'
  editButton.addEventListener('click', () => startEdit(project.id))

  const deleteButton = document.createElement('button')
  deleteButton.type = 'button'
  deleteButton.className = 'row-button delete'
  deleteButton.textContent = '删除'
  deleteButton.addEventListener('click', () => deleteProject(project.id))

  cell.append(detailButton, editButton, deleteButton)
  return cell
}

function renderTable() {
  const projects = getFilteredProjects()
  tableBody.replaceChildren()

  if (projects.length === 0) {
    const row = document.createElement('tr')
    row.className = 'empty-row'
    const cell = document.createElement('td')
    cell.colSpan = 23
    cell.textContent = state.query || state.yearFilter ? '没有找到匹配的项目' : '暂无项目，先录入第一条数据吧'
    row.append(cell)
    tableBody.append(row)
    return
  }

  const fragment = document.createDocumentFragment()
  projects.forEach((project) => {
    const calculated = calculateProject(project)
    const row = document.createElement('tr')
    row.append(
      createCell('序号', project.serial || '-'),
      createCell('项目日期', project.projectDate),
      createCell('项目名称', project.projectName || '-'),
      createCell('合同含税金额', formatMoney(project.contractAmount), 'money-cell'),
      createCell('不含税金额', formatMoney(calculated.untaxedAmount), 'money-cell'),
      createCostCell(project, 'payment'),
      createCell('未付款金额', formatMoney(calculated.unpaidAmount), `money-cell ${calculated.unpaidAmount < 0 ? 'negative-value' : ''}`),
      createCostCell(project, 'labor'),
      createCostCell(project, 'material'),
      createManagementFeeCell(project),
      createCostCell(project, 'other'),
      createCell('总费用', formatMoney(calculated.totalCost), 'money-cell'),
      createCell('预估结余', formatMoney(calculated.balance), `money-cell ${calculated.balance < 0 ? 'negative-value' : 'positive-value'}`),
      createCell('质保期', project.warrantyPeriod || '-'),
      createInvoiceCell(project),
      createCell('签约公司', project.company || '-'),
      createCell('税点', formatPercent(project.taxRate)),
      createCell('预交税费', formatMoney(project.prepaidTaxAmount), 'money-cell'),
      createCell('利润', formatMoney(calculated.profit), `money-cell ${calculated.profit < 0 ? 'negative-value' : ''}`),
      createCell('毛利率(含税)', formatPercent(calculated.grossMargin), 'money-cell'),
      createCell('利润率(不含税)', formatPercent(calculated.untaxedProfitRate), 'money-cell'),
      createCell('备注', project.notes || '-', 'notes-cell'),
      createActionCell(project)
    )
    fragment.append(row)
  })
  tableBody.append(fragment)
}

function render() {
  renderYearOptions()
  renderSummary()
  renderTable()
}

function getPreviewProject() {
  return normalizeProject({
    projectDate: getControl('projectDate').value,
    contractAmount: getControl('contractAmount').value,
    company: getControl('company').value,
    taxRate: getControl('taxRate').value,
    prepaidTaxAmount: getControl('prepaidTaxAmount').value,
    managementFeeAmount: state.draftManagement.amount,
    managementFeeManual: state.draftManagement.manual,
    managementFeeConfigured: state.draftManagement.configured,
    laborDetails: state.draftDetails.laborDetails,
    materialDetails: state.draftDetails.materialDetails,
    otherDetails: state.draftDetails.otherDetails,
    paymentDetails: state.draftDetails.paymentDetails,
    invoiceDetails: state.draftDetails.invoiceDetails
  })
}

function updateCalculationPreview() {
  const calculated = calculateProject(getPreviewProject())
  document.querySelector('#previewUnpaid').textContent = formatMoney(calculated.unpaidAmount)
  document.querySelector('#previewUntaxed').textContent = formatMoney(calculated.untaxedAmount)
  document.querySelector('#previewCost').textContent = formatMoney(calculated.totalCost)
  document.querySelector('#previewCostRatio').textContent = formatPercent(calculated.costRatio)

  const managementFeeDisplay = document.querySelector('#managementFeeDisplay')
  managementFeeDisplay.textContent = formatMoney(calculated.managementFeeAmount)
  managementFeeDisplay.nextElementSibling.textContent = state.draftManagement.manual ? '手工金额，点击修改' : '按签约公司自动计算'

  const balanceElement = document.querySelector('#previewBalance')
  balanceElement.textContent = formatMoney(calculated.balance)
  balanceElement.classList.toggle('negative-value', calculated.balance < 0)
}

function syncDraftCostDisplays() {
  document.querySelector('#laborCostDisplay').textContent = formatMoney(sumCostItems('labor', state.draftDetails.laborDetails))
  document.querySelector('#materialCostDisplay').textContent = formatMoney(sumCostItems('material', state.draftDetails.materialDetails))
  document.querySelector('#otherCostDisplay').textContent = formatMoney(sumCostItems('other', state.draftDetails.otherDetails))
  document.querySelector('#paidAmountDisplay').textContent = formatMoney(sumCostItems('payment', state.draftDetails.paymentDetails))
  document.querySelector('#invoiceDisplay').textContent = formatMoney(sumCostItems('invoice', state.draftDetails.invoiceDetails))
  const draftManagement = calculateProject(getPreviewProject())
  document.querySelector('#managementFeeDisplay').textContent = formatMoney(draftManagement.managementFeeAmount)
  document.querySelector('#managementFeeDisplay').nextElementSibling.textContent = state.draftManagement.manual ? '手工金额，点击修改' : '按签约公司自动计算'
  updateCalculationPreview()
}

function getProjectFromForm() {
  const values = Object.fromEntries(new FormData(form).entries())
  const existing = state.projects.find((project) => project.id === state.editingId)
  return normalizeProject({
    ...values,
    id: existing?.id,
    createdAt: existing?.createdAt,
    laborDetails: state.draftDetails.laborDetails,
    materialDetails: state.draftDetails.materialDetails,
    otherDetails: state.draftDetails.otherDetails,
    paymentDetails: state.draftDetails.paymentDetails,
    invoice: state.draftDetails.invoiceDetails.length > 0 ? '' : existing?.invoice,
    invoiceDetails: state.draftDetails.invoiceDetails,
    managementFeeAmount: state.draftManagement.amount,
    managementFeeManual: state.draftManagement.manual,
    managementFeeConfigured: state.draftManagement.configured,
    updatedAt: new Date().toISOString()
  })
}

function resetEditor() {
  state.editingId = null
  state.draftDetails = createEmptyDetails()
  state.draftManagement = createEmptyManagement()
  state.managementContext = null
  formTitle.textContent = '新增项目'
  submitButton.textContent = '保存项目'
  form.reset()
  syncDraftCostDisplays()
}

function openCreateDialog() {
  resetEditor()
  renderCompanyOptions()
  getControl('projectDate').value = getToday()
  updateCalculationPreview()
  projectDialog.showModal()
  requestAnimationFrame(() => getControl('serial').focus())
}

function startEdit(id) {
  const project = state.projects.find((item) => item.id === id)
  if (!project) return

  resetEditor()
  state.editingId = id
  state.draftDetails = {
    laborDetails: cloneItems(project.laborDetails),
    materialDetails: cloneItems(project.materialDetails),
    otherDetails: cloneItems(project.otherDetails),
    paymentDetails: cloneItems(project.paymentDetails),
    invoiceDetails: cloneItems(project.invoiceDetails)
  }
  state.draftManagement = {
    amount: project.managementFeeAmount,
    manual: project.managementFeeManual,
    configured: project.managementFeeConfigured
  }
  formTitle.textContent = '编辑项目'
  submitButton.textContent = '保存修改'
  renderCompanyOptions(project.company)

  Object.entries(project).forEach(([name, value]) => {
    const control = getControl(name)
    if (control && !Array.isArray(value)) control.value = value
  })
  syncDraftCostDisplays()
  projectDialog.showModal()
  requestAnimationFrame(() => getControl('projectName').focus())
}

function deleteProject(id) {
  const project = state.projects.find((item) => item.id === id)
  if (!project || !confirm(`确定删除项目“${project.projectName}”吗？`)) return

  state.projects = state.projects.filter((item) => item.id !== id)
  if (state.editingId === id) resetEditor()
  saveProjects()
  render()
  showToast('项目已删除')
}

function handleSubmit(event) {
  event.preventDefault()
  if (!form.reportValidity()) return

  const project = getProjectFromForm()
  const duplicate = state.projects.find((item) => item.serial === project.serial && item.id !== state.editingId)
  if (duplicate) {
    showToast(`序号“${project.serial}”已存在`, true)
    getControl('serial').focus()
    return
  }

  if (state.editingId) {
    state.projects = state.projects.map((item) => item.id === state.editingId ? project : item)
    showToast('项目修改已保存')
  } else {
    state.projects.unshift(project)
    state.yearFilter = getProjectYear(project)
    state.query = ''
    searchInput.value = ''
    showToast('项目已保存')
  }

  saveProjects()
  render()
  projectDialog.close()
}

function getActiveCostItems() {
  const config = COST_CONFIG[state.costType]
  if (!config || !state.costContext) return []
  if (state.costContext.mode === 'draft') return state.draftDetails[config.detailKey]
  const project = state.projects.find((item) => item.id === state.costContext.projectId)
  return project ? project[config.detailKey] : []
}

function setActiveCostItems(items) {
  const config = COST_CONFIG[state.costType]
  if (!config || !state.costContext) return
  const normalizedItems = items.map((item) => normalizeCostItem(state.costType, item, getCostFallbackDate()))

  if (state.costContext.mode === 'draft') {
    state.draftDetails[config.detailKey] = normalizedItems
    syncDraftCostDisplays()
    return
  }

  state.projects = state.projects.map((project) => project.id === state.costContext.projectId
    ? normalizeProject({ ...project, [config.detailKey]: normalizedItems, updatedAt: new Date().toISOString() })
    : project)
  saveProjects()
  render()
}

function getCostFallbackDate() {
  if (state.costContext?.mode === 'project') {
    return state.projects.find((project) => project.id === state.costContext.projectId)?.projectDate || getToday()
  }
  return getControl('projectDate').value || getToday()
}

function createLaborDurationEntriesField(field) {
  const label = document.createElement('div')
  label.className = 'field field-full labor-duration-details-field'
  const title = document.createElement('span')
  title.textContent = `${field.label} *`
  const list = document.createElement('div')
  list.className = 'labor-duration-entry-editor'
  const addButton = document.createElement('button')
  addButton.type = 'button'
  addButton.className = 'button button-secondary labor-duration-entry-add'
  addButton.textContent = '新增日期和工期'
  addButton.addEventListener('click', () => appendLaborDurationEntryRow(list))
  label.append(title, list, addButton)
  appendLaborDurationEntryRow(list)
  return label
}

function appendLaborDurationEntryRow(list, entry = {}) {
  const row = document.createElement('div')
  row.className = 'labor-duration-entry-row'
  row.dataset.durationId = toText(entry.id)
  const dateTitle = document.createElement('span')
  dateTitle.className = 'labor-duration-entry-label'
  dateTitle.textContent = '登记日期'
  const date = document.createElement('input')
  date.name = 'registrationDate'
  date.type = 'date'
  date.required = true
  date.value = entry.registrationDate || getCostFallbackDate()
  date.dataset.durationDate = 'true'
  const daysTitle = document.createElement('span')
  daysTitle.className = 'labor-duration-entry-label'
  daysTitle.textContent = '工期（天）'
  const days = document.createElement('input')
  days.name = 'days'
  days.type = 'number'
  days.min = '0'
  days.step = '0.01'
  days.inputMode = 'decimal'
  days.required = true
  days.value = entry.days == null ? '' : entry.days
  days.dataset.durationDays = 'true'
  const removeButton = document.createElement('button')
  removeButton.type = 'button'
  removeButton.className = 'row-button delete'
  removeButton.textContent = '删除'
  removeButton.addEventListener('click', () => {
    if (list.children.length === 1) {
      date.value = getCostFallbackDate()
      days.value = ''
      row.dataset.durationId = ''
      return
    }
    row.remove()
  })
  row.append(dateTitle, date, daysTitle, days, removeButton)
  list.append(row)
}

function renderLaborDurationEntriesEditor(entries) {
  const list = costItemFields.querySelector('.labor-duration-entry-editor')
  if (!list) return
  list.replaceChildren()
  const source = Array.isArray(entries) && entries.length > 0 ? entries : [{}]
  source.forEach((entry) => appendLaborDurationEntryRow(list, entry))
}

function collectLaborDurationEntries() {
  const list = costItemFields.querySelector('.labor-duration-entry-editor')
  if (!list) return []
  return Array.from(list.children).map((row) => ({
    id: row.dataset.durationId || '',
    registrationDate: row.querySelector('[data-duration-date]')?.value || '',
    days: row.querySelector('[data-duration-days]')?.value || ''
  })).filter((entry) => entry.registrationDate || toNumber(entry.days) > 0)
}

function createCostField(field) {
  if (field.type === 'labor-duration-details') return createLaborDurationEntriesField(field)
  if (field.type === 'other-details') return createOtherDetailsField(field)
  const label = document.createElement('label')
  label.className = 'field'
  const title = document.createElement('span')
  title.textContent = field.required ? `${field.label} *` : field.label
  const input = field.type === 'select'
    ? document.createElement('select')
    : (field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input'))
  input.name = field.name
  if (field.type !== 'select' && field.type !== 'textarea') input.type = field.type
  input.required = Boolean(field.required)
  if (field.min != null) input.min = String(field.min)
  if (field.step != null) input.step = String(field.step)
  if (field.maxlength != null) input.maxLength = field.maxlength
  if (field.type === 'select') {
    const placeholder = document.createElement('option')
    placeholder.value = ''
    placeholder.textContent = '请选择产品'
    input.append(placeholder)
    const options = typeof field.options === 'function' ? field.options() : field.options
    options.forEach((optionValue) => {
      const option = document.createElement('option')
      option.value = optionValue
      option.textContent = optionValue
      input.append(option)
    })
  }
  if (field.type === 'textarea') input.rows = 3
  if (field.type === 'number') input.inputMode = 'decimal'
  label.append(title, input)
  return label
}

function resetCostItemEditor() {
  state.editingCostItemId = null
  costItemForm.reset()
  if (state.costType === 'other') renderOtherDetailsEditor([])
  if (state.costType === 'labor') renderLaborDurationEntriesEditor([])
  saveCostItemButton.textContent = '新增明细'
  cancelCostEditButton.hidden = true
  const dateControl = costItemForm.elements.namedItem('expenseDate')
    || costItemForm.elements.namedItem('paymentDate')
    || costItemForm.elements.namedItem('invoiceDate')
  if (dateControl) dateControl.value = getCostFallbackDate()
}

function getCostContextProject() {
  if (state.costContext?.mode === 'project') {
    return state.projects.find((project) => project.id === state.costContext.projectId) || null
  }
  if (state.costContext?.mode === 'draft') return getPreviewProject()
  return null
}

function createDetailTable(type, items, editable, project = null) {
  const config = COST_CONFIG[type]
  const wrap = document.createElement('div')
  wrap.className = 'table-wrap cost-detail-table'
  const table = document.createElement('table')
  table.className = 'detail-table'
  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  config.columns.forEach((column) => {
    const th = document.createElement('th')
    th.textContent = column.label
    appendFormulaHelp(th, column.formulaKey)
    headRow.append(th)
  })
  if (editable) {
    const th = document.createElement('th')
    th.textContent = '操作'
    headRow.append(th)
  }
  thead.append(headRow)

  const tbody = document.createElement('tbody')
  items.forEach((item) => {
    const row = document.createElement('tr')
    config.columns.forEach((column) => {
      if (type === 'labor' && column.key === 'duration' && editable) {
        const cell = document.createElement('td')
        cell.dataset.label = column.label
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'cost-link-button'
        const displayProject = project || getCostContextProject()
        const displayValue = column.value(item, displayProject)
        button.textContent = displayValue
        button.title = '点击维护登记日期和工期'
        button.addEventListener('click', () => openLaborDurationDialog(item.id))
        cell.append(button)
        row.append(cell)
        return
      }
      row.append(createCell(column.label, column.value(item, project || getCostContextProject())))
    })
    if (editable) {
      const actions = document.createElement('td')
      actions.dataset.label = '操作'
      actions.className = 'actions-cell'
      const editButton = document.createElement('button')
      editButton.type = 'button'
      editButton.className = 'row-button'
      editButton.textContent = '编辑'
      editButton.addEventListener('click', () => editCostItem(item.id))
      const deleteButton = document.createElement('button')
      deleteButton.type = 'button'
      deleteButton.className = 'row-button delete'
      deleteButton.textContent = '删除'
      deleteButton.addEventListener('click', () => deleteCostItem(item.id))
      actions.append(editButton, deleteButton)
      row.append(actions)
    }
    tbody.append(row)
  })
  table.append(thead, tbody)
  wrap.append(table)
  return wrap
}

function renderCostDetailList() {
  const config = COST_CONFIG[state.costType]
  const items = getActiveCostItems()
  const total = sumCostItems(state.costType, items)
  costDialogTotal.textContent = `合计：${formatMoney(total)}`
  costDetailList.replaceChildren()

  if (items.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'detail-empty'
    empty.textContent = `暂无${config.label}明细，请先新增。`
    costDetailList.append(empty)
    return
  }
  costDetailList.append(createDetailTable(state.costType, items, true))
}

function openCostDialog(type, context) {
  const config = COST_CONFIG[type]
  if (!config) return
  state.costType = type
  state.costContext = context
  state.editingCostItemId = null

  costDialogTitle.textContent = `${config.label}明细`
  if (context.mode === 'project') {
    const project = state.projects.find((item) => item.id === context.projectId)
    costDialogContext.textContent = project ? `${project.serial} · ${project.projectName}` : '当前项目'
  } else {
    costDialogContext.textContent = state.editingId ? '编辑项目草稿' : '新增项目草稿'
  }

  costItemFields.replaceChildren(...config.fields.map(createCostField))
  resetCostItemEditor()
  renderCostDetailList()
  costDialog.showModal()
  requestAnimationFrame(() => costItemForm.querySelector('input')?.focus())
}

function editCostItem(id) {
  const item = getActiveCostItems().find((entry) => entry.id === id)
  if (!item) return
  state.editingCostItemId = id
  if (state.costType === 'other') {
    ;['expenseDate', 'payer', 'note'].forEach((name) => {
      const control = costItemForm.elements.namedItem(name)
      if (control) control.value = item[name] || ''
    })
    renderOtherDetailsEditor(item.details)
  } else {
    if (state.costType === 'labor') {
      costItemForm.elements.namedItem('name').value = item.name || ''
      costItemForm.elements.namedItem('unitPrice').value = item.unitPrice ?? ''
      renderLaborDurationEntriesEditor(item.durationEntries)
    } else {
      COST_CONFIG[state.costType].fields.forEach((field) => {
        const control = costItemForm.elements.namedItem(field.name)
      if (control) {
        if (field.name === 'product' && control.tagName === 'SELECT' && item.product
          && !Array.from(control.options).some((option) => option.value === item.product)) {
          const option = document.createElement('option')
          option.value = item.product
          option.textContent = `${item.product}（历史值）`
          control.append(option)
        }
        const value = item[field.name]
        control.value = value ?? ''
        }
      })
    }
  }
  saveCostItemButton.textContent = '保存修改'
  cancelCostEditButton.hidden = false
  costItemForm.querySelector('input')?.focus()
}

function deleteCostItem(id) {
  const message = state.costType === 'labor'
    ? '确定删除该人员及其全部工期登记吗？'
    : '确定删除这条费用明细吗？'
  if (!confirm(message)) return
  setActiveCostItems(getActiveCostItems().filter((item) => item.id !== id))
  resetCostItemEditor()
  renderCostDetailList()
  showToast('费用明细已删除')
}

function handleCostItemSubmit(event) {
  event.preventDefault()
  if (!costItemForm.reportValidity()) return

  const values = Object.fromEntries(new FormData(costItemForm).entries())
  if (state.costType === 'other') {
    values.details = collectOtherDetails()
    if (values.details.length === 0) {
      showToast('请至少填写一条费用明细', true)
      return
    }
  }
  const items = getActiveCostItems()
  const existing = items.find((item) => item.id === state.editingCostItemId)
  if (state.costType === 'labor') {
    const durationEntries = collectLaborDurationEntries()
    if (durationEntries.length === 0) {
      showToast('请至少填写一条日期和工期', true)
      return
    }
    values.durationEntries = durationEntries
  }
  const costItem = normalizeCostItem(
    state.costType,
    { ...existing, ...values, id: existing?.id },
    getCostFallbackDate()
  )
  const updatedItems = existing
    ? items.map((item) => item.id === existing.id ? costItem : item)
    : [...items, costItem]

  setActiveCostItems(updatedItems)
  resetCostItemEditor()
  renderCostDetailList()
  showToast(existing ? '费用明细已修改' : '费用明细已新增')
}

function getActiveLaborPerson() {
  if (state.costType !== 'labor' || !state.laborDurationPersonId) return null
  return getActiveCostItems().find((item) => item.id === state.laborDurationPersonId) || null
}

function resetLaborDurationEditor() {
  state.editingLaborDurationId = null
  laborDurationForm.reset()
  laborDurationForm.elements.namedItem('registrationDate').value = getCostFallbackDate()
  saveLaborDurationButton.textContent = '新增登记'
  cancelLaborDurationEditButton.hidden = true
}

function renderLaborDurationDetailList() {
  const person = getActiveLaborPerson()
  if (!person) return
  laborDurationDialogContext.textContent = person.name || '当前人员'
  laborDurationDialogTotal.textContent = `汇总工期：${formatNumber(getLaborDuration(person))} 天`
  laborDurationDetailList.replaceChildren()

  if (person.durationEntries.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'detail-empty'
    empty.textContent = '暂无工期登记，请先新增。'
    laborDurationDetailList.append(empty)
    return
  }

  const wrap = document.createElement('div')
  wrap.className = 'table-wrap cost-detail-table'
  const table = document.createElement('table')
  table.className = 'detail-table labor-duration-table'
  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  ;['登记日期', '工期', '操作'].forEach((label) => {
    const th = document.createElement('th')
    th.textContent = label
    headRow.append(th)
  })
  thead.append(headRow)

  const tbody = document.createElement('tbody')
  person.durationEntries.forEach((entry) => {
    const row = document.createElement('tr')
    const actions = document.createElement('td')
    actions.dataset.label = '操作'
    actions.className = 'actions-cell'
    const editButton = document.createElement('button')
    editButton.type = 'button'
    editButton.className = 'row-button'
    editButton.textContent = '编辑'
    editButton.addEventListener('click', () => editLaborDurationEntry(entry.id))
    const deleteButton = document.createElement('button')
    deleteButton.type = 'button'
    deleteButton.className = 'row-button delete'
    deleteButton.textContent = '删除'
    deleteButton.addEventListener('click', () => deleteLaborDurationEntry(entry.id))
    actions.append(editButton, deleteButton)
    row.append(
      createCell('登记日期', entry.registrationDate),
      createCell('工期', `${formatNumber(entry.days)} 天`),
      actions
    )
    tbody.append(row)
  })
  table.append(thead, tbody)
  wrap.append(table)
  laborDurationDetailList.append(wrap)
}

function openLaborDurationDialog(personId) {
  if (state.costType !== 'labor') return
  const person = getActiveCostItems().find((item) => item.id === personId)
  if (!person) return
  state.laborDurationPersonId = personId
  laborDurationDialogTitle.textContent = `${person.name || '人员'} · 工期登记`
  resetLaborDurationEditor()
  renderLaborDurationDetailList()
  laborDurationDialog.showModal()
}

function editLaborDurationEntry(id) {
  const entry = getActiveLaborPerson()?.durationEntries.find((item) => item.id === id)
  if (!entry) return
  state.editingLaborDurationId = id
  laborDurationForm.elements.namedItem('registrationDate').value = entry.registrationDate
  laborDurationForm.elements.namedItem('days').value = entry.days
  saveLaborDurationButton.textContent = '保存修改'
  cancelLaborDurationEditButton.hidden = false
  laborDurationForm.elements.namedItem('registrationDate').focus()
}

function updateActiveLaborDurationEntries(entries) {
  const person = getActiveLaborPerson()
  if (!person) return
  const updatedPerson = normalizeCostItem('labor', { ...person, durationEntries: entries }, getCostFallbackDate())
  setActiveCostItems(getActiveCostItems().map((item) => item.id === person.id ? updatedPerson : item))
  renderCostDetailList()
}

function deleteLaborDurationEntry(id) {
  const person = getActiveLaborPerson()
  if (!person || !confirm('确定删除这条工期登记吗？')) return
  updateActiveLaborDurationEntries(person.durationEntries.filter((entry) => entry.id !== id))
  resetLaborDurationEditor()
  renderLaborDurationDetailList()
  showToast('工期登记已删除')
}

function handleLaborDurationSubmit(event) {
  event.preventDefault()
  if (!laborDurationForm.reportValidity()) return
  const person = getActiveLaborPerson()
  if (!person) return
  const values = Object.fromEntries(new FormData(laborDurationForm).entries())
  const existing = person.durationEntries.find((entry) => entry.id === state.editingLaborDurationId)
  const durationEntry = normalizeDurationEntry({ ...values, id: existing?.id }, getCostFallbackDate())
  const entries = existing
    ? person.durationEntries.map((entry) => entry.id === existing.id ? durationEntry : entry)
    : [...person.durationEntries, durationEntry]
  updateActiveLaborDurationEntries(entries)
  resetLaborDurationEditor()
  renderLaborDurationDetailList()
  showToast(existing ? '工期登记已修改' : '工期登记已新增')
}

function closeLaborDurationDialog() {
  if (laborDurationDialog.open) laborDurationDialog.close()
}

function closeCostDialog() {
  closeLaborDurationDialog()
  if (costDialog.open) costDialog.close()
}

function createDetailInfo(label, value, className = '') {
  const item = document.createElement('div')
  item.className = `detail-info-item ${className}`.trim()
  const term = document.createElement('dt')
  term.textContent = label
  appendFormulaHelp(term, DETAIL_FORMULA_KEYS[label])
  const description = document.createElement('dd')
  description.textContent = value
  item.append(term, description)
  return item
}

function createCostDetailSection(type, project) {
  const config = COST_CONFIG[type]
  const items = project[config.detailKey]
  const section = document.createElement('section')
  section.className = 'project-cost-section'
  const heading = document.createElement('div')
  heading.className = 'detail-section-heading'
  const title = document.createElement('h3')
  title.textContent = `${config.label}明细`
  const total = document.createElement('strong')
  total.textContent = `合计 ${formatMoney(project[config.amountKey])}`
  heading.append(title, total)
  section.append(heading)

  if (items.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'detail-empty'
    empty.textContent = `暂无${config.label}明细`
    section.append(empty)
  } else {
    section.append(createDetailTable(type, items, false, project))
  }
  return section
}

function showProjectDetail(id) {
  const project = state.projects.find((item) => item.id === id)
  if (!project) return
  const calculated = calculateProject(project)
  detailDialogTitle.textContent = `${project.projectName || '项目'}详情`

  const info = document.createElement('dl')
  info.className = 'project-detail-grid'
  ;[
    ['序号', project.serial || '-'],
    ['项目日期', project.projectDate],
    ['项目名称', project.projectName || '-'],
    ['合同含税金额', formatMoney(project.contractAmount)],
    ['不含税金额', formatMoney(calculated.untaxedAmount)],
    ['已付款金额', formatMoney(project.paidAmount)],
    ['未付款金额', formatMoney(calculated.unpaidAmount)],
    ['人工费', formatMoney(project.laborCost)],
    ['材料费', formatMoney(project.materialCost)],
    ['其它费用', formatMoney(project.otherCost)],
    ['管理费', formatMoney(calculated.managementFeeAmount)],
    ['预交税费', formatMoney(project.prepaidTaxAmount)],
    ['项目总费用', formatMoney(calculated.totalCost)],
    ['费用占比', formatPercent(calculated.costRatio)],
    ['利润', formatMoney(calculated.profit)],
    ['毛利率（含税）', formatPercent(calculated.grossMargin)],
    ['利润率（不含税）', formatPercent(calculated.untaxedProfitRate)],
    ['预估结余', formatMoney(calculated.balance)],
    ['质保期', project.warrantyPeriod || '-'],
    ['开票', project.invoiceDetails.length > 0 ? formatMoney(project.invoiceAmount) : (project.invoice || '-')],
    ['签约公司', project.company || '-'],
    ['税点', formatPercent(project.taxRate)],
    ['备注', project.notes || '-', 'detail-info-wide']
  ].forEach(([label, value, className]) => info.append(createDetailInfo(label, value, className)))

  projectDetailContent.replaceChildren(
    info,
    createCostDetailSection('payment', project),
    createCostDetailSection('labor', project),
    createCostDetailSection('invoice', project),
    createCostDetailSection('material', project),
    createCostDetailSection('other', project)
  )
  detailDialog.showModal()
}

function getSettlementDefaultDate() {
  const today = getToday()
  if (!state.yearFilter || today.startsWith(state.yearFilter)) return today
  return `${state.yearFilter}-01-01`
}

function resetSettlementEditor() {
  state.editingSettlementId = null
  settlementForm.reset()
  settlementForm.elements.namedItem('settlementDate').value = getSettlementDefaultDate()
  saveSettlementButton.textContent = '新增明细'
  cancelSettlementEditButton.hidden = true
}

function renderSettlementDetailList() {
  const settlements = getYearFilteredSettlements()
  settlementDialogTitle.textContent = state.yearFilter ? `${state.yearFilter} 年结款明细` : '全部结款明细'
  settlementDialogContext.textContent = state.yearFilter ? `${state.yearFilter} 年度` : '全部年度'
  settlementDialogTotal.textContent = `合计：${formatMoney(sumSettlements(settlements))}`
  settlementDetailList.replaceChildren()

  if (settlements.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'detail-empty'
    empty.textContent = state.yearFilter ? `${state.yearFilter} 年暂无结款明细` : '暂无结款明细，请先新增。'
    settlementDetailList.append(empty)
    return
  }

  const wrap = document.createElement('div')
  wrap.className = 'table-wrap cost-detail-table'
  const table = document.createElement('table')
  table.className = 'detail-table settlement-table'
  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  ;['结款金额', '结款日期', '结款来源', '备注', '操作'].forEach((label) => {
    const th = document.createElement('th')
    th.textContent = label
    headRow.append(th)
  })
  thead.append(headRow)

  const tbody = document.createElement('tbody')
  settlements.forEach((settlement) => {
    const row = document.createElement('tr')
    const actions = document.createElement('td')
    actions.dataset.label = '操作'
    actions.className = 'actions-cell'
    const editButton = document.createElement('button')
    editButton.type = 'button'
    editButton.className = 'row-button'
    editButton.textContent = '编辑'
    editButton.addEventListener('click', () => editSettlement(settlement.id))
    const deleteButton = document.createElement('button')
    deleteButton.type = 'button'
    deleteButton.className = 'row-button delete'
    deleteButton.textContent = '删除'
    deleteButton.addEventListener('click', () => deleteSettlement(settlement.id))
    actions.append(editButton, deleteButton)
    row.append(
      createCell('结款金额', formatMoney(settlement.amount), 'money-cell'),
      createCell('结款日期', settlement.settlementDate),
      createCell('结款来源', settlement.source || '-'),
      createCell('备注', settlement.note || '-', 'notes-cell'),
      actions
    )
    tbody.append(row)
  })
  table.append(thead, tbody)
  wrap.append(table)
  settlementDetailList.append(wrap)
}

function openSettlementDialog() {
  resetSettlementEditor()
  renderSettlementDetailList()
  settlementDialog.showModal()
  requestAnimationFrame(() => settlementForm.elements.namedItem('amount').focus())
}

function editSettlement(id) {
  const settlement = state.settlements.find((item) => item.id === id)
  if (!settlement) return
  state.editingSettlementId = id
  settlementForm.elements.namedItem('amount').value = settlement.amount
  settlementForm.elements.namedItem('settlementDate').value = settlement.settlementDate
  settlementForm.elements.namedItem('source').value = settlement.source || ''
  settlementForm.elements.namedItem('note').value = settlement.note || ''
  saveSettlementButton.textContent = '保存修改'
  cancelSettlementEditButton.hidden = false
  settlementForm.elements.namedItem('amount').focus()
}

function deleteSettlement(id) {
  if (!confirm('确定删除这条结款明细吗？')) return
  state.settlements = state.settlements.filter((settlement) => settlement.id !== id)
  saveSettlements()
  resetSettlementEditor()
  renderYearOptions()
  renderSummary()
  renderSettlementDetailList()
  showToast('结款明细已删除')
}

function handleSettlementSubmit(event) {
  event.preventDefault()
  if (!settlementForm.reportValidity()) return

  const values = Object.fromEntries(new FormData(settlementForm).entries())
  const existing = state.settlements.find((settlement) => settlement.id === state.editingSettlementId)
  const settlement = normalizeSettlement({
    ...values,
    id: existing?.id,
    createdAt: existing?.createdAt,
    updatedAt: new Date().toISOString()
  })
  state.settlements = existing
    ? state.settlements.map((item) => item.id === existing.id ? settlement : item)
    : [...state.settlements, settlement]
  saveSettlements()
  resetSettlementEditor()
  renderYearOptions()
  renderSummary()
  renderSettlementDetailList()
  showToast(existing ? '结款明细已修改' : '结款明细已新增')
}

function closeSettlementDialog() {
  if (settlementDialog.open) settlementDialog.close()
}

function downloadBlob(content, fileName, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function getDateStamp() {
  return getToday().replaceAll('-', '')
}

function exportExcel() {
  const workbook = createExcelWorkbook()
  downloadBlob(workbook, `项目费用备份-${getDateStamp()}.xls`, 'application/vnd.ms-excel;charset=utf-8')
  showToast('Excel 文件已导出')
}

function csvCell(value) {
  return `"${toText(value).replaceAll('"', '""')}"`
}

function exportCsv() {
  const headers = [
    '序号', '项目日期', '项目名称', '合同含税金额', '不含税金额', '已付款金额', '未付款金额',
    '人工费', '材料费', '管理费', '其它费用', '总费用', '费用占比(%)', '预估结余', '质保期', '开票',
    '签约公司', '税点(%)', '预交税费', '利润', '毛利率(含税)(%)', '利润率(不含税)(%)', '备注'
  ]
  const rows = state.projects.map((project) => {
    const calculated = calculateProject(project)
    return [
      project.serial,
      project.projectDate,
      project.projectName,
      project.contractAmount,
      calculated.untaxedAmount.toFixed(2),
      project.paidAmount,
      calculated.unpaidAmount,
      project.laborCost,
      project.materialCost,
      calculated.managementFeeAmount,
      project.otherCost,
      calculated.totalCost,
      calculated.costRatio.toFixed(2),
      calculated.balance,
      project.warrantyPeriod,
      project.invoice,
      project.company,
      project.taxRate,
      project.prepaidTaxAmount,
      calculated.profit,
      calculated.grossMargin.toFixed(2),
      calculated.untaxedProfitRate.toFixed(2),
      project.notes
    ].map(csvCell).join(',')
  })
  const csv = `\ufeff${headers.map(csvCell).join(',')}\r\n${rows.join('\r\n')}`
  downloadBlob(csv, `项目费用明细-${getDateStamp()}.csv`, 'text/csv;charset=utf-8')
  showToast('CSV 文件已导出')
}

async function importLegacyJsonFile(file) {
  try {
    const parsed = JSON.parse(await file.text())
    const source = Array.isArray(parsed) ? parsed : parsed.projects
    const settlementSource = Array.isArray(parsed?.settlements) ? parsed.settlements : []
    if (!Array.isArray(source)) throw new Error('备份中没有项目列表')

    const projects = source.map(normalizeProject).filter((project) => project.serial && project.projectName)
    const settlements = settlementSource.map(normalizeSettlement)
    if (source.length > 0 && projects.length === 0) throw new Error('备份中的项目数据格式不正确')
    if ((state.projects.length > 0 || state.settlements.length > 0)
      && !confirm(`导入将替换当前 ${state.projects.length} 条项目和 ${state.settlements.length} 条结款明细，是否继续？`)) return

    state.projects = projects
    state.settlements = settlements
    state.yearFilter = ''
    state.query = ''
    searchInput.value = ''
    saveProjects()
    saveSettlements()
    resetEditor()
    render()
    showToast(`已导入 ${projects.length} 条项目和 ${settlements.length} 条结款明细`)
  } catch (error) {
    console.error('导入备份失败', error)
    showToast(`导入失败：${error.message}`, true)
  } finally {
    importFileInput.value = ''
  }
}

function clearAllProjects() {
  if (state.projects.length === 0 && state.settlements.length === 0) {
    showToast('当前没有可清空的数据')
    return
  }
  if (!confirm('确定清空全部项目和结款明细吗？此操作无法撤销，建议先导出 Excel。')) return

  state.projects = []
  state.settlements = []
  state.yearFilter = ''
  state.query = ''
  searchInput.value = ''
  saveProjects()
  saveSettlements()
  resetEditor()
  render()
  showToast('全部项目和结款明细已清空')
}

function applyKeywordSearch() {
  state.query = searchInput.value
  renderTable()
}

form.addEventListener('submit', handleSubmit)
form.addEventListener('input', updateCalculationPreview)
openDictionaryDialogButton.addEventListener('click', openDictionaryDialog)
closeDictionaryDialogButton.addEventListener('click', closeDictionaryDialog)
finishDictionaryDialogButton.addEventListener('click', closeDictionaryDialog)
dictionaryDialog.addEventListener('click', (event) => {
  if (event.target === dictionaryDialog) closeDictionaryDialog()
})
addProjectButton.addEventListener('click', openCreateDialog)
closeDialogButton.addEventListener('click', () => projectDialog.close())
cancelFormButton.addEventListener('click', () => projectDialog.close())
projectDialog.addEventListener('close', resetEditor)
projectDialog.addEventListener('click', (event) => {
  if (event.target === projectDialog) projectDialog.close()
})

document.querySelector('#laborCostButton').addEventListener('click', () => openCostDialog('labor', { mode: 'draft' }))
document.querySelector('#paidAmountButton').addEventListener('click', () => openCostDialog('payment', { mode: 'draft' }))
document.querySelector('#materialCostButton').addEventListener('click', () => openCostDialog('material', { mode: 'draft' }))
document.querySelector('#otherCostButton').addEventListener('click', () => openCostDialog('other', { mode: 'draft' }))
document.querySelector('#invoiceButton').addEventListener('click', () => openCostDialog('invoice', { mode: 'draft' }))
document.querySelector('#managementFeeButton').addEventListener('click', () => openManagementFeeDialog({ mode: 'draft' }))
managementFeeForm.addEventListener('submit', (event) => {
  event.preventDefault()
  saveManagementFee(true)
})
document.querySelector('#resetManagementFeeButton').addEventListener('click', () => saveManagementFee(false))
document.querySelector('#closeManagementFeeDialogButton').addEventListener('click', closeManagementFeeDialog)
document.querySelector('#finishManagementFeeDialogButton').addEventListener('click', closeManagementFeeDialog)
managementFeeDialog.addEventListener('click', (event) => {
  if (event.target === managementFeeDialog) closeManagementFeeDialog()
})
managementFeeDialog.addEventListener('close', () => {
  state.managementContext = null
})
costItemForm.addEventListener('submit', handleCostItemSubmit)
cancelCostEditButton.addEventListener('click', resetCostItemEditor)
document.querySelector('#closeCostDialogButton').addEventListener('click', closeCostDialog)
document.querySelector('#finishCostDialogButton').addEventListener('click', closeCostDialog)
laborDurationForm.addEventListener('submit', handleLaborDurationSubmit)
cancelLaborDurationEditButton.addEventListener('click', resetLaborDurationEditor)
document.querySelector('#closeLaborDurationDialogButton').addEventListener('click', closeLaborDurationDialog)
document.querySelector('#finishLaborDurationDialogButton').addEventListener('click', closeLaborDurationDialog)
laborDurationDialog.addEventListener('click', (event) => {
  if (event.target === laborDurationDialog) closeLaborDurationDialog()
})
laborDurationDialog.addEventListener('close', () => {
  state.laborDurationPersonId = null
  state.editingLaborDurationId = null
})
costDialog.addEventListener('click', (event) => {
  if (event.target === costDialog) closeCostDialog()
})
costDialog.addEventListener('close', () => {
  closeLaborDurationDialog()
  state.costType = null
  state.costContext = null
  state.editingCostItemId = null
  state.laborDurationPersonId = null
  state.editingLaborDurationId = null
})

const closeDetailDialog = () => detailDialog.close()
document.querySelector('#closeDetailDialogButton').addEventListener('click', closeDetailDialog)
document.querySelector('#finishDetailDialogButton').addEventListener('click', closeDetailDialog)
detailDialog.addEventListener('click', (event) => {
  if (event.target === detailDialog) closeDetailDialog()
})

document.querySelector('#openSettlementDialogButton').addEventListener('click', openSettlementDialog)
settlementForm.addEventListener('submit', handleSettlementSubmit)
cancelSettlementEditButton.addEventListener('click', resetSettlementEditor)
document.querySelector('#closeSettlementDialogButton').addEventListener('click', closeSettlementDialog)
document.querySelector('#finishSettlementDialogButton').addEventListener('click', closeSettlementDialog)
settlementDialog.addEventListener('click', (event) => {
  if (event.target === settlementDialog) closeSettlementDialog()
})
settlementDialog.addEventListener('close', resetSettlementEditor)

keywordSearchButton.addEventListener('click', applyKeywordSearch)
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') applyKeywordSearch()
})
yearSearchButton.addEventListener('click', () => {
  state.yearFilter = yearFilter.value
  renderSummary()
  renderTable()
})
yearResetButton.addEventListener('click', () => {
  state.yearFilter = ''
  yearFilter.value = ''
  renderSummary()
  renderTable()
})
document.querySelector('#exportExcelButton').addEventListener('click', exportExcel)
document.querySelector('#importExcelButton').addEventListener('click', () => importFileInput.click())
importFileInput.addEventListener('change', () => {
  const [file] = importFileInput.files
  if (file) importExcelFile(file)
})
document.querySelector('#clearAllButton').addEventListener('click', clearAllProjects)

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  deferredInstallPrompt = event
  installButton.hidden = false
})

installButton.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return
  deferredInstallPrompt.prompt()
  await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null
  installButton.hidden = true
})

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null
  installButton.hidden = true
  showToast('已安装到设备')
})

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.error('注册离线服务失败', error)
    })
  })
}

saveProjects()
saveSettlements()
saveDictionaries()
initializeFormulaHelp()
render()
renderCompanyOptions()
syncDraftCostDisplays()


const EXCEL_XML_NAMESPACE = 'urn:schemas-microsoft-com:office:spreadsheet'

function excelEscape(value) {
  return toText(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function excelAttribute(value) {
  return excelEscape(value).replaceAll('"', '&quot;')
}

function excelCell(value) {
  const isNumber = typeof value === 'number' && Number.isFinite(value)
  const type = isNumber ? 'Number' : 'String'
  const content = isNumber ? String(value) : excelEscape(value)
  return `<Cell><Data ss:Type="${type}">${content}</Data></Cell>`
}

function excelRow(values) {
  return `<Row>${values.map(excelCell).join('')}</Row>`
}

function excelWorksheet(name, headers, rows) {
  return `<Worksheet ss:Name="${excelAttribute(name)}"><Table>${excelRow(headers)}${rows.map(excelRow).join('')}</Table></Worksheet>`
}

function createExcelWorkbook() {
  const projectHeaders = [
    'id', 'projectDate', 'serial', 'projectName', 'contractAmount', 'paidAmount',
    'warrantyPeriod', 'invoice', 'company', 'taxRate', 'notes', 'createdAt', 'updatedAt',
    'unpaidAmount', 'untaxedAmount', 'laborCost', 'materialCost', 'otherCost',
    'totalCost', 'costRatio', 'balance', 'managementFeeAmount', 'managementFeeManual',
    'managementFeeConfigured', 'prepaidTaxAmount', 'managementFee', 'profit', 'grossMargin',
    'untaxedProfitRate'  ]
  const projectRows = state.projects.map((project) => {
    const calculated = calculateProject(project)
    return [
      project.id, project.projectDate, project.serial, project.projectName, project.contractAmount,
      project.paidAmount, project.warrantyPeriod, project.invoice, project.company, project.taxRate,
      project.notes, project.createdAt, project.updatedAt, calculated.unpaidAmount,
      calculated.untaxedAmount, project.laborCost, project.materialCost, project.otherCost,
      calculated.totalCost, calculated.costRatio, calculated.balance, project.managementFeeAmount,
      project.managementFeeManual, project.managementFeeConfigured, project.prepaidTaxAmount,
      calculated.managementFeeAmount, calculated.profit, calculated.grossMargin, calculated.untaxedProfitRate
    ]
  })
  const laborRows = []
  const durationRows = []
  const materialRows = []
  const otherRows = []
  const invoiceRows = []
  const paymentRows = []
  state.projects.forEach((project) => {
    project.laborDetails.forEach((item) => {
      laborRows.push([project.id, item.id, item.name, item.unitPrice])
      ;(item.durationEntries || []).forEach((entry) => {
        durationRows.push([project.id, item.id, entry.id, entry.registrationDate, entry.days])
      })
    })
    project.materialDetails.forEach((item) => {
      materialRows.push([project.id, item.id, item.product, item.pickupQuantity, item.unitPrice, item.usedQuantity, item.remainingQuantity])
    })
    project.otherDetails.forEach((item) => {
      const details = item.details?.length ? item.details : [{ category: item.category, amount: item.amount }]
      details.forEach((detail) => {
        otherRows.push([project.id, item.id, item.expenseDate, detail.category, detail.amount, item.payer, item.note])
      })
    })
    project.invoiceDetails.forEach((item) => {
      invoiceRows.push([project.id, item.id, item.invoiceDate, item.amount])
    })
    project.paymentDetails.forEach((item) => {
      paymentRows.push([project.id, item.id, item.paymentDate, item.amount])
    })
  })
  const settlementRows = state.settlements.map((settlement) => [
    settlement.id, settlement.amount, settlement.settlementDate, settlement.createdAt, settlement.updatedAt,
    settlement.source, settlement.note
  ])
  const worksheets = [
    excelWorksheet('备份信息', ['version', 'exportedAt'], [[7, new Date().toISOString()]]),
    excelWorksheet('项目列表', projectHeaders, projectRows),
    excelWorksheet('人工明细', ['projectId', 'laborId', 'name', 'unitPrice'], laborRows),
    excelWorksheet('工期登记', ['projectId', 'laborId', 'id', 'registrationDate', 'days'], durationRows),
    excelWorksheet('材料明细', ['projectId', 'id', 'product', 'pickupQuantity', 'unitPrice', 'usedQuantity', 'remainingQuantity'], materialRows),
    excelWorksheet('其它费用', ['projectId', 'id', 'expenseDate', 'detailCategory', 'detailAmount', 'payer', 'note'], otherRows),
    excelWorksheet('开票明细', ['projectId', 'id', 'invoiceDate', 'amount'], invoiceRows),
    excelWorksheet('付款明细', ['projectId', 'id', 'paymentDate', 'amount'], paymentRows),
    excelWorksheet('结款明细', ['id', 'amount', 'settlementDate', 'createdAt', 'updatedAt', 'source', 'note'], settlementRows)
  ]
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    `<Workbook xmlns="${EXCEL_XML_NAMESPACE}" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="${EXCEL_XML_NAMESPACE}" xmlns:html="http://www.w3.org/TR/REC-html40">`,
    worksheets.join(''),
    '</Workbook>'
  ].join('')
}

function excelSheetRows(document, sheetName) {
  const worksheets = Array.from(document.getElementsByTagName('*'))
    .filter((element) => element.localName === 'Worksheet')
  const worksheet = worksheets.find((element) => (
    element.getAttributeNS(EXCEL_XML_NAMESPACE, 'Name')
      || element.getAttribute('ss:Name')
      || element.getAttribute('Name')
  ) === sheetName)
  if (!worksheet) return []
  const table = Array.from(worksheet.getElementsByTagName('*'))
    .find((element) => element.localName === 'Table')
  if (!table) return []
  return Array.from(table.children)
    .filter((element) => element.localName === 'Row')
    .map((row) => Array.from(row.children)
      .filter((cell) => cell.localName === 'Cell')
      .map((cell) => {
        const data = Array.from(cell.children).find((element) => element.localName === 'Data')
        return data ? data.textContent : ''
      }))
}

function excelValue(row, index) {
  return row[index] == null ? '' : row[index]
}

function parseExcelWorkbook(text) {
  const document = new DOMParser().parseFromString(text, 'application/xml')
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Excel 文件格式无法识别')
  }
  const projectListRows = excelSheetRows(document, '项目列表')
  const legacyProjectRows = excelSheetRows(document, '项目汇总')
  const projectRows = projectListRows.length > 0 ? projectListRows : legacyProjectRows
  if (projectRows.length === 0) throw new Error('Excel 文件中没有项目列表工作表')
  const projectHasManagementColumns = projectRows[0]?.includes('managementFeeConfigured')

  const laborByProject = new Map()
  const durationByLabor = new Map()
  excelSheetRows(document, '工期登记').slice(1).forEach((row) => {
    const laborId = excelValue(row, 1)
    if (!laborId) return
    const entries = durationByLabor.get(laborId) || []
    entries.push({
      id: excelValue(row, 2) || createId(),
      registrationDate: excelValue(row, 3),
      days: excelValue(row, 4)
    })
    durationByLabor.set(laborId, entries)
  })
  excelSheetRows(document, '人工明细').slice(1).forEach((row) => {
    const projectId = excelValue(row, 0)
    if (!projectId) return
    const items = laborByProject.get(projectId) || []
    const laborId = excelValue(row, 1) || createId()
    items.push({
      id: laborId,
      name: excelValue(row, 2),
      unitPrice: excelValue(row, 3),
      durationEntries: durationByLabor.get(laborId) || []
    })
    laborByProject.set(projectId, items)
  })

  const materialByProject = new Map()
  const materialSheetRows = excelSheetRows(document, '材料明细')
  const materialHasPickupColumn = materialSheetRows[0]?.includes('pickupQuantity')
  materialSheetRows.slice(1).forEach((row) => {
    const projectId = excelValue(row, 0)
    if (!projectId) return
    const items = materialByProject.get(projectId) || []
    items.push({
      id: excelValue(row, 1) || createId(),
      product: excelValue(row, 2),
      pickupQuantity: materialHasPickupColumn ? excelValue(row, 3) : 0,
      unitPrice: excelValue(row, materialHasPickupColumn ? 4 : 3),
      usedQuantity: excelValue(row, materialHasPickupColumn ? 5 : 4),
      remainingQuantity: excelValue(row, materialHasPickupColumn ? 6 : 5)
    })
    materialByProject.set(projectId, items)
  })

  const otherByProject = new Map()
  const otherSheetRows = excelSheetRows(document, '其它费用')
  const otherHasDetailsColumn = otherSheetRows[0]?.includes('detailCategory')
  otherSheetRows.slice(1).forEach((row) => {
    const projectId = excelValue(row, 0)
    if (!projectId) return
    const items = otherByProject.get(projectId) || []
    const itemId = excelValue(row, 1) || createId()
    if (otherHasDetailsColumn) {
      let item = items.find((entry) => entry.id === itemId)
      if (!item) {
        item = {
          id: itemId,
          expenseDate: excelValue(row, 2),
          details: [],
          payer: excelValue(row, 5),
          note: excelValue(row, 6)
        }
        items.push(item)
      }
      item.details.push({ category: excelValue(row, 3), amount: excelValue(row, 4) })
    } else {
      items.push({
        id: itemId,
        category: excelValue(row, 2),
        expenseDate: excelValue(row, 3),
        amount: excelValue(row, 4)
      })
    }
    otherByProject.set(projectId, items)
  })

  const invoiceByProject = new Map()
  const invoiceSheetRows = excelSheetRows(document, '开票明细')
  invoiceSheetRows.slice(1).forEach((row) => {
    const projectId = excelValue(row, 0)
    if (!projectId) return
    const items = invoiceByProject.get(projectId) || []
    items.push({
      id: excelValue(row, 1) || createId(),
      invoiceDate: excelValue(row, 2),
      amount: excelValue(row, 3)
    })
    invoiceByProject.set(projectId, items)
  })

  const paymentByProject = new Map()
  const paymentSheetRows = excelSheetRows(document, '付款明细')
  paymentSheetRows.slice(1).forEach((row) => {
    const projectId = excelValue(row, 0)
    if (!projectId) return
    const items = paymentByProject.get(projectId) || []
    items.push({
      id: excelValue(row, 1) || createId(),
      paymentDate: excelValue(row, 2),
      amount: excelValue(row, 3)
    })
    paymentByProject.set(projectId, items)
  })

  const projectRowsData = projectRows.slice(1).filter((row) => row.some((value) => toText(value).trim()))
  const projects = projectRowsData.map((row) => {
    const id = excelValue(row, 0) || createId()
    return normalizeProject({
      id,
      projectDate: excelValue(row, 1),
      serial: excelValue(row, 2),
      projectName: excelValue(row, 3),
      contractAmount: excelValue(row, 4),
      paidAmount: excelValue(row, 5),
      warrantyPeriod: excelValue(row, 6),
      invoice: excelValue(row, 7),
      company: excelValue(row, 8),
      taxRate: excelValue(row, 9),
      notes: excelValue(row, 10),
      createdAt: excelValue(row, 11),
      updatedAt: excelValue(row, 12),
      ...(projectHasManagementColumns ? {
        managementFeeAmount: excelValue(row, 21),
        managementFeeManual: parseBoolean(excelValue(row, 22)),
        managementFeeConfigured: parseBoolean(excelValue(row, 23), true),
        prepaidTaxAmount: excelValue(row, 24)
      } : {}),
      laborDetails: laborByProject.get(id) || [],
      ...(materialSheetRows.length > 1 ? { materialDetails: materialByProject.get(id) || [] } : {}),
      ...(otherSheetRows.length > 1 ? { otherDetails: otherByProject.get(id) || [] } : {}),
      ...(invoiceByProject.has(id) ? { invoiceDetails: invoiceByProject.get(id) } : {}),
      ...(paymentByProject.has(id) ? { paymentDetails: paymentByProject.get(id) } : {})
    })
  }).filter((project) => project.serial && project.projectName)

  if (projectRowsData.length > 0 && projects.length === 0) {
    throw new Error('Excel 中的项目数据格式不正确')
  }
  const settlements = excelSheetRows(document, '结款明细').slice(1)
    .filter((row) => row.some((value) => toText(value).trim()))
    .map((row) => normalizeSettlement({
      id: excelValue(row, 0),
      amount: excelValue(row, 1),
      settlementDate: excelValue(row, 2),
      createdAt: excelValue(row, 3),
      updatedAt: excelValue(row, 4),
      source: excelValue(row, 5),
      note: excelValue(row, 6)
    }))
  return { projects, settlements }
}

async function importExcelFile(file) {
  try {
    const text = await file.text()
    const trimmed = text.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      await importLegacyJsonFile(file)
      return
    }
    const { projects, settlements } = parseExcelWorkbook(text)
    if ((state.projects.length > 0 || state.settlements.length > 0)
      && !confirm(`导入将替换当前 ${state.projects.length} 条项目和 ${state.settlements.length} 条结款明细，是否继续？`)) return

    state.projects = projects
    state.settlements = settlements
    state.yearFilter = ''
    state.query = ''
    searchInput.value = ''
    saveProjects()
    saveSettlements()
    resetEditor()
    render()
    showToast(`已导入 Excel：${projects.length} 条项目和 ${settlements.length} 条结款明细`)
  } catch (error) {
    console.error('导入 Excel 失败', error)
    showToast(`Excel 导入失败：${error.message}`, true)
  } finally {
    importFileInput.value = ''
  }
}


function createOtherDetailsField(field) {
  const label = document.createElement('label')
  label.className = 'field field-full other-details-field'
  const title = document.createElement('span')
  title.textContent = `${field.label} *`
  const list = document.createElement('div')
  list.className = 'other-detail-editor'
  const addButton = document.createElement('button')
  addButton.type = 'button'
  addButton.className = 'button button-secondary other-detail-add'
  addButton.textContent = '新增费用类别'
  addButton.addEventListener('click', () => appendOtherDetailRow(list))
  label.append(title, list, addButton)
  appendOtherDetailRow(list)
  return label
}

function appendOtherDetailRow(list, detail = {}) {
  const row = document.createElement('div')
  row.className = 'other-detail-row'
  const category = document.createElement('input')
  category.name = 'otherDetailCategory'
  category.type = 'text'
  category.maxLength = 100
  category.required = true
  category.placeholder = '费用类别，如餐饮'
  category.value = detail.category || ''
  category.dataset.detailCategory = 'true'
  const amount = document.createElement('input')
  amount.name = 'otherDetailAmount'
  amount.type = 'number'
  amount.min = '0'
  amount.step = '0.01'
  amount.inputMode = 'decimal'
  amount.required = true
  amount.placeholder = '金额'
  amount.value = detail.amount == null ? '' : detail.amount
  amount.dataset.detailAmount = 'true'
  const removeButton = document.createElement('button')
  removeButton.type = 'button'
  removeButton.className = 'row-button delete'
  removeButton.textContent = '删除'
  removeButton.addEventListener('click', () => {
    if (list.children.length === 1) {
      category.value = ''
      amount.value = ''
      return
    }
    row.remove()
  })
  row.append(category, amount, removeButton)
  list.append(row)
}

function renderOtherDetailsEditor(details) {
  const list = costItemFields.querySelector('.other-detail-editor')
  if (!list) return
  list.replaceChildren()
  const source = Array.isArray(details) && details.length > 0 ? details : [{}]
  source.forEach((detail) => appendOtherDetailRow(list, detail))
}

function collectOtherDetails() {
  const list = costItemFields.querySelector('.other-detail-editor')
  if (!list) return []
  return Array.from(list.children).map((row) => ({
    category: row.querySelector('[data-detail-category]')?.value.trim() || '',
    amount: row.querySelector('[data-detail-amount]')?.value || 0
  })).filter((detail) => detail.category || toNumber(detail.amount) > 0)
}
