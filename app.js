'use strict'

const STORAGE_KEY = 'calculator-tool-projects-v1'
const SETTLEMENT_STORAGE_KEY = 'calculator-tool-settlements-v1'
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

const form = document.querySelector('#projectForm')
const formTitle = document.querySelector('#formTitle')
const submitButton = document.querySelector('#submitButton')
const projectDialog = document.querySelector('#projectDialog')
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
const costDialog = document.querySelector('#costDialog')
const costItemForm = document.querySelector('#costItemForm')
const costItemFields = document.querySelector('#costItemFields')
const costDetailList = document.querySelector('#costDetailList')
const costDialogTitle = document.querySelector('#costDialogTitle')
const costDialogContext = document.querySelector('#costDialogContext')
const costDialogTotal = document.querySelector('#costDialogTotal')
const saveCostItemButton = document.querySelector('#saveCostItemButton')
const cancelCostEditButton = document.querySelector('#cancelCostEditButton')
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

const COST_CONFIG = {
  labor: {
    label: '人工费',
    detailKey: 'laborDetails',
    amountKey: 'laborCost',
    fields: [
      { name: 'name', label: '姓名', type: 'text', maxlength: 100, required: true },
      { name: 'duration', label: '工期', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'unitPrice', label: '单价', type: 'number', min: 0, step: 0.01, required: true }
    ],
    columns: [
      { label: '姓名', value: (item) => item.name || '-' },
      { label: '工期', value: (item) => formatNumber(item.duration) },
      { label: '单价', value: (item) => formatMoney(item.unitPrice) },
      { label: '总计', value: (item) => formatMoney(getCostItemAmount('labor', item)) }
    ]
  },
  material: {
    label: '材料费',
    detailKey: 'materialDetails',
    amountKey: 'materialCost',
    fields: [
      { name: 'product', label: '产品', type: 'text', maxlength: 100, required: true },
      { name: 'unitPrice', label: '单价', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'usedQuantity', label: '使用', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'remainingQuantity', label: '剩余', type: 'number', min: 0, step: 0.01, required: true }
    ],
    columns: [
      { label: '产品', value: (item) => item.product || '-' },
      { label: '单价', value: (item) => formatMoney(item.unitPrice) },
      { label: '使用', value: (item) => formatNumber(item.usedQuantity) },
      { label: '剩余', value: (item) => formatNumber(item.remainingQuantity) },
      { label: '使用金额', value: (item) => formatMoney(getCostItemAmount('material', item)) }
    ]
  },
  other: {
    label: '其它费用',
    detailKey: 'otherDetails',
    amountKey: 'otherCost',
    fields: [
      { name: 'category', label: '类别', type: 'text', maxlength: 100, required: true },
      { name: 'expenseDate', label: '日期', type: 'date', required: true },
      { name: 'amount', label: '金额', type: 'number', min: 0, step: 0.01, required: true }
    ],
    columns: [
      { label: '类别', value: (item) => item.category || '-' },
      { label: '日期', value: (item) => item.expenseDate || '-' },
      { label: '金额', value: (item) => formatMoney(item.amount) }
    ]
  }
}

const state = {
  projects: loadProjects(),
  settlements: loadSettlements(),
  editingId: null,
  query: '',
  yearFilter: '',
  draftDetails: createEmptyDetails(),
  costType: null,
  costContext: null,
  editingCostItemId: null,
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
  return { laborDetails: [], materialDetails: [], otherDetails: [] }
}

function cloneItems(items) {
  return items.map((item) => ({ ...item }))
}

function getCostItemAmount(type, item) {
  if (type === 'labor') return Math.max(0, toNumber(item.duration)) * Math.max(0, toNumber(item.unitPrice))
  if (type === 'material') return Math.max(0, toNumber(item.unitPrice)) * Math.max(0, toNumber(item.usedQuantity))
  return Math.max(0, toNumber(item.amount))
}

function normalizeCostItem(type, item, fallbackDate = getToday()) {
  const id = toText(item.id) || createId()
  if (type === 'labor') {
    return {
      id,
      name: toText(item.name).trim(),
      duration: Math.max(0, toNumber(item.duration)),
      unitPrice: Math.max(0, toNumber(item.unitPrice))
    }
  }
  if (type === 'material') {
    return {
      id,
      product: toText(item.product).trim(),
      unitPrice: Math.max(0, toNumber(item.unitPrice)),
      usedQuantity: Math.max(0, toNumber(item.usedQuantity ?? item.used)),
      remainingQuantity: Math.max(0, toNumber(item.remainingQuantity ?? item.remaining))
    }
  }
  const expenseDate = isValidDateText(item.expenseDate) ? item.expenseDate : fallbackDate
  return {
    id,
    category: toText(item.category).trim(),
    expenseDate,
    amount: Math.max(0, toNumber(item.amount))
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

  return {
    id: toText(project.id) || createId(),
    projectDate,
    serial: toText(project.serial).trim(),
    projectName: toText(project.projectName).trim(),
    contractAmount: Math.max(0, toNumber(project.contractAmount)),
    paidAmount: Math.max(0, toNumber(project.paidAmount)),
    laborDetails,
    materialDetails,
    otherDetails,
    laborCost: sumCostItems('labor', laborDetails),
    materialCost: sumCostItems('material', materialDetails),
    otherCost: sumCostItems('other', otherDetails),
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
    showToast('结款数据保存失败，请立即导出备份', true)
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
    showToast('本地保存失败，请立即导出备份', true)
  }
}

function calculateProject(project) {
  const unpaidAmount = project.contractAmount - project.paidAmount
  const totalCost = project.laborCost + project.materialCost + project.otherCost
  const balance = project.contractAmount - totalCost
  const untaxedAmount = project.contractAmount / (1 + project.taxRate / 100)
  const costRatio = project.contractAmount > 0 ? totalCost / project.contractAmount * 100 : 0
  return { unpaidAmount, totalCost, balance, untaxedAmount, costRatio }
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

function getControl(name) {
  return form.elements.namedItem(name)
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
    result.totalCost += calculated.totalCost
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
    totalCost: 0,
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
  document.querySelector('#totalCost').textContent = formatMoney(totals.totalCost)
  const totalCostRatio = totals.contractAmount > 0 ? totals.totalCost / totals.contractAmount * 100 : 0
  document.querySelector('#totalCostRatio').textContent = formatPercent(totalCostRatio)
  document.querySelector('#totalSettled').textContent = formatMoney(settledAmount)

  const unsettledElement = document.querySelector('#totalUnsettled')
  unsettledElement.textContent = formatMoney(unsettledAmount)
  unsettledElement.classList.toggle('negative-value', unsettledAmount < 0)

  const balanceElement = document.querySelector('#totalBalance')
  balanceElement.textContent = formatMoney(totals.balance)
  balanceElement.classList.toggle('negative-value', totals.balance < 0)
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
    cell.colSpan = 19
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
      createCell('已付款金额', formatMoney(project.paidAmount), 'money-cell'),
      createCell('未付款金额', formatMoney(calculated.unpaidAmount), `money-cell ${calculated.unpaidAmount < 0 ? 'negative-value' : ''}`),
      createCostCell(project, 'labor'),
      createCostCell(project, 'material'),
      createCostCell(project, 'other'),
      createCell('总费用', formatMoney(calculated.totalCost), 'money-cell'),
      createCell('费用占比', formatPercent(calculated.costRatio), 'money-cell'),
      createCell('预估结余', formatMoney(calculated.balance), `money-cell ${calculated.balance < 0 ? 'negative-value' : 'positive-value'}`),
      createCell('质保期', project.warrantyPeriod || '-'),
      createCell('开票', project.invoice || '-'),
      createCell('签约公司', project.company || '-'),
      createCell('税点', formatPercent(project.taxRate)),
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
    paidAmount: getControl('paidAmount').value,
    taxRate: getControl('taxRate').value,
    laborDetails: state.draftDetails.laborDetails,
    materialDetails: state.draftDetails.materialDetails,
    otherDetails: state.draftDetails.otherDetails
  })
}

function updateCalculationPreview() {
  const calculated = calculateProject(getPreviewProject())
  document.querySelector('#previewUnpaid').textContent = formatMoney(calculated.unpaidAmount)
  document.querySelector('#previewUntaxed').textContent = formatMoney(calculated.untaxedAmount)
  document.querySelector('#previewCost').textContent = formatMoney(calculated.totalCost)
  document.querySelector('#previewCostRatio').textContent = formatPercent(calculated.costRatio)

  const balanceElement = document.querySelector('#previewBalance')
  balanceElement.textContent = formatMoney(calculated.balance)
  balanceElement.classList.toggle('negative-value', calculated.balance < 0)
}

function syncDraftCostDisplays() {
  document.querySelector('#laborCostDisplay').textContent = formatMoney(sumCostItems('labor', state.draftDetails.laborDetails))
  document.querySelector('#materialCostDisplay').textContent = formatMoney(sumCostItems('material', state.draftDetails.materialDetails))
  document.querySelector('#otherCostDisplay').textContent = formatMoney(sumCostItems('other', state.draftDetails.otherDetails))
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
    updatedAt: new Date().toISOString()
  })
}

function resetEditor() {
  state.editingId = null
  state.draftDetails = createEmptyDetails()
  formTitle.textContent = '新增项目'
  submitButton.textContent = '保存项目'
  form.reset()
  syncDraftCostDisplays()
}

function openCreateDialog() {
  resetEditor()
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
    otherDetails: cloneItems(project.otherDetails)
  }
  formTitle.textContent = '编辑项目'
  submitButton.textContent = '保存修改'

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

function createCostField(field) {
  const label = document.createElement('label')
  label.className = 'field'
  const title = document.createElement('span')
  title.textContent = field.required ? `${field.label} *` : field.label
  const input = document.createElement('input')
  input.name = field.name
  input.type = field.type
  input.required = Boolean(field.required)
  if (field.min != null) input.min = String(field.min)
  if (field.step != null) input.step = String(field.step)
  if (field.maxlength != null) input.maxLength = field.maxlength
  if (field.type === 'number') input.inputMode = 'decimal'
  label.append(title, input)
  return label
}

function resetCostItemEditor() {
  state.editingCostItemId = null
  costItemForm.reset()
  saveCostItemButton.textContent = '新增明细'
  cancelCostEditButton.hidden = true
  const dateControl = costItemForm.elements.namedItem('expenseDate')
  if (dateControl) dateControl.value = getCostFallbackDate()
}

function createDetailTable(type, items, editable) {
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
      const cell = createCell(column.label, column.value(item))
      row.append(cell)
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
  COST_CONFIG[state.costType].fields.forEach((field) => {
    const control = costItemForm.elements.namedItem(field.name)
    if (control) control.value = item[field.name]
  })
  saveCostItemButton.textContent = '保存修改'
  cancelCostEditButton.hidden = false
  costItemForm.querySelector('input')?.focus()
}

function deleteCostItem(id) {
  if (!confirm('确定删除这条费用明细吗？')) return
  setActiveCostItems(getActiveCostItems().filter((item) => item.id !== id))
  resetCostItemEditor()
  renderCostDetailList()
  showToast('费用明细已删除')
}

function handleCostItemSubmit(event) {
  event.preventDefault()
  if (!costItemForm.reportValidity()) return

  const values = Object.fromEntries(new FormData(costItemForm).entries())
  const items = getActiveCostItems()
  const existing = items.find((item) => item.id === state.editingCostItemId)
  const costItem = normalizeCostItem(state.costType, { ...values, id: existing?.id }, getCostFallbackDate())
  const updatedItems = existing
    ? items.map((item) => item.id === existing.id ? costItem : item)
    : [...items, costItem]

  setActiveCostItems(updatedItems)
  resetCostItemEditor()
  renderCostDetailList()
  showToast(existing ? '费用明细已修改' : '费用明细已新增')
}

function closeCostDialog() {
  if (costDialog.open) costDialog.close()
}

function createDetailInfo(label, value, className = '') {
  const item = document.createElement('div')
  item.className = `detail-info-item ${className}`.trim()
  const term = document.createElement('dt')
  term.textContent = label
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
    section.append(createDetailTable(type, items, false))
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
    ['项目总费用', formatMoney(calculated.totalCost)],
    ['费用占比', formatPercent(calculated.costRatio)],
    ['预估结余', formatMoney(calculated.balance)],
    ['质保期', project.warrantyPeriod || '-'],
    ['开票', project.invoice || '-'],
    ['签约公司', project.company || '-'],
    ['税点', formatPercent(project.taxRate)],
    ['备注', project.notes || '-', 'detail-info-wide']
  ].forEach(([label, value, className]) => info.append(createDetailInfo(label, value, className)))

  projectDetailContent.replaceChildren(
    info,
    createCostDetailSection('labor', project),
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
  ;['结款金额', '结款日期', '操作'].forEach((label) => {
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

function exportJson() {
  const backup = {
    version: 3,
    exportedAt: new Date().toISOString(),
    projects: state.projects,
    settlements: state.settlements
  }
  downloadBlob(JSON.stringify(backup, null, 2), `项目费用备份-${getDateStamp()}.json`, 'application/json;charset=utf-8')
  showToast('备份文件已导出')
}

function csvCell(value) {
  return `"${toText(value).replaceAll('"', '""')}"`
}

function exportCsv() {
  const headers = [
    '序号', '项目日期', '项目名称', '合同含税金额', '不含税金额', '已付款金额', '未付款金额',
    '人工费', '材料费', '其它费用', '总费用', '费用占比(%)', '预估结余', '质保期', '开票',
    '签约公司', '税点(%)', '备注'
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
      project.otherCost,
      calculated.totalCost,
      calculated.costRatio.toFixed(2),
      calculated.balance,
      project.warrantyPeriod,
      project.invoice,
      project.company,
      project.taxRate,
      project.notes
    ].map(csvCell).join(',')
  })
  const csv = `\ufeff${headers.map(csvCell).join(',')}\r\n${rows.join('\r\n')}`
  downloadBlob(csv, `项目费用明细-${getDateStamp()}.csv`, 'text/csv;charset=utf-8')
  showToast('CSV 文件已导出')
}

async function importJsonFile(file) {
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
  if (!confirm('确定清空全部项目和结款明细吗？此操作无法撤销，建议先导出备份。')) return

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
addProjectButton.addEventListener('click', openCreateDialog)
closeDialogButton.addEventListener('click', () => projectDialog.close())
cancelFormButton.addEventListener('click', () => projectDialog.close())
projectDialog.addEventListener('close', resetEditor)
projectDialog.addEventListener('click', (event) => {
  if (event.target === projectDialog) projectDialog.close()
})

document.querySelector('#laborCostButton').addEventListener('click', () => openCostDialog('labor', { mode: 'draft' }))
document.querySelector('#materialCostButton').addEventListener('click', () => openCostDialog('material', { mode: 'draft' }))
document.querySelector('#otherCostButton').addEventListener('click', () => openCostDialog('other', { mode: 'draft' }))
costItemForm.addEventListener('submit', handleCostItemSubmit)
cancelCostEditButton.addEventListener('click', resetCostItemEditor)
document.querySelector('#closeCostDialogButton').addEventListener('click', closeCostDialog)
document.querySelector('#finishCostDialogButton').addEventListener('click', closeCostDialog)
costDialog.addEventListener('click', (event) => {
  if (event.target === costDialog) closeCostDialog()
})
costDialog.addEventListener('close', () => {
  state.costType = null
  state.costContext = null
  state.editingCostItemId = null
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
document.querySelector('#exportJsonButton').addEventListener('click', exportJson)
document.querySelector('#importJsonButton').addEventListener('click', () => importFileInput.click())
importFileInput.addEventListener('change', () => {
  const [file] = importFileInput.files
  if (file) importJsonFile(file)
})
document.querySelector('#exportCsvButton').addEventListener('click', exportCsv)
document.querySelector('#printButton').addEventListener('click', () => window.print())
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
render()
syncDraftCostDisplays()
