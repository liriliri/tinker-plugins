import i18n from 'i18next'
import contain from 'licia/contain'
import filter from 'licia/filter'

const HIDDEN = new Set([
  'code',
  'SecuCode',
  'SecuCodeSurfix',
  'BlockTradingInfos',
  'LhbTradingDetails',
  'MarginTradeInfos',
  'LgtHoldInfo',
  'EnterpriseType',
  'MainOperIncomeIndustry',
  'MainOperIncomeProduct',
  'MainOperIncomeRegion',
  'BusinessDist',
  'RegionDist',
  '_date',
])

const FUND_PRIORITY = [
  'EndDate',
  'date',
  'ClosePrice',
  'MainNetFlow',
  'MainNetFlow5D',
  'MainNetFlow10D',
  'MainNetFlow20D',
  'MainInFlow',
  'MainIn',
  'MainOutFlow',
  'MainOut',
  'JumboNetFlow',
  'BlockNetFlow',
  'MidNetFlow',
  'SmallNetFlow',
  'RetailInFlow',
  'RetailIn',
  'RetailOutFlow',
  'RetailOut',
  'RetailNetFlow',
  'TotalNetFlow',
  'MainInflowCircRate',
  'MainInflowRank',
  'MainInflowIndustryRank',
  'LgtHoldShares',
  'LgtHoldRatio',
  'ShortRatio',
  'ShortShares',
]

const SHAREHOLDER_PRIORITY = [
  'no',
  'name',
  'institution',
  'date',
  'reportingPeriod',
  'holdShares',
  'shares',
  'holdingShares',
  'holdPct',
  'holdingPct',
  'pct',
  'holdChange',
  'changeShares',
  'instCount',
  'instIncreaseCount',
  'totalSHNum',
  'aSHNum',
  'avgHoldShares',
  'aAvgHoldShares',
]

const DIVIDEND_PRIORITY = [
  'reportEndDate',
  'dividendPlan',
  'cashDiviRMB',
  'cashDivPerShare',
  'dividend',
  'specialDivPerShare',
  'totalCashDiviComRMB',
  'totalCashDivi',
  'exDiviDate',
  'exDivDate',
  'rightRegDate',
  'regDate',
  'cashPayDate',
  'payDate',
  'dividendType',
  'procedure',
  'bonusShareRatio',
  'tranAddShareRatio',
  'dividendFlag',
  'dividendCurrency',
  'proposalSn',
]

function stripPrefix(key: string): string {
  const idx = key.lastIndexOf('.')
  return idx >= 0 ? key.slice(idx + 1) : key
}

function colI18nKey(field: string): string {
  const camel = field.replace(/_([A-Za-z0-9])/g, (_, c: string) =>
    c.toUpperCase(),
  )
  return `col${camel.charAt(0).toUpperCase()}${camel.slice(1)}`
}

const SECTION_I18N_KEYS: Record<string, string> = {
  lrb: 'sectionLrb',
  zhsy: 'sectionZhsy',
  zcfz: 'sectionZcfz',
  xjll: 'sectionXjll',
  income: 'sectionIncome',
  balance: 'sectionBalance',
  cashflow: 'sectionCashflow',
  十大股东: 'sectionTopHolders',
  十大流通股东: 'sectionTopTradableHolders',
  股东户数统计: 'sectionShareholderCount',
  持股股东信息: 'sectionMajorHolders',
  股东分布: 'sectionHolderDistribution',
  机构持仓统计: 'sectionInstitutionalHoldings',
  分红历史: 'sectionDividendHistory',
}

function tOpt(key: string, lang?: string): string | null {
  if (!i18n.exists(key)) return null
  return lang ? i18n.t(key, { lng: lang }) : i18n.t(key)
}

function humanizeKey(key: string): string {
  return stripPrefix(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
}

function isHiddenColumn(key: string): boolean {
  return HIDDEN.has(key) || HIDDEN.has(stripPrefix(key))
}

function isStockHeaderTitle(title: string): boolean {
  return /^(sh|sz|bj|hk|us)[a-z0-9]+/i.test(title.trim())
}

export function columnLabel(key: string, lang?: string): string {
  return (
    tOpt(colI18nKey(key), lang) ||
    tOpt(colI18nKey(stripPrefix(key)), lang) ||
    humanizeKey(key)
  )
}

export function sectionLabel(title: string, lang?: string): string {
  if (!title || title === 'data') return ''
  const cleaned = title.replace(/^#+\s*/, '').trim()
  if (isStockHeaderTitle(cleaned)) return ''
  const i18nKey = SECTION_I18N_KEYS[cleaned] || SECTION_I18N_KEYS[title]
  return (i18nKey && tOpt(i18nKey, lang)) || cleaned
}

export function visibleColumns(
  columns: string[],
  options?: {
    prefer?: 'fund' | 'dividend' | 'shareholder'
    maxCols?: number
  },
): string[] {
  const filtered = filter(columns, (col) => !isHiddenColumn(col))
  const prefer =
    options?.prefer === 'fund'
      ? FUND_PRIORITY
      : options?.prefer === 'dividend'
        ? DIVIDEND_PRIORITY
        : options?.prefer === 'shareholder'
          ? SHAREHOLDER_PRIORITY
          : null

  let ordered = filtered
  if (prefer) {
    const set = new Set(filtered)
    const head = filter(prefer, (col) => set.has(col))
    const rest = filter(filtered, (col) => !contain(prefer, col))
    ordered = [...head, ...rest]
  }

  const maxCols = options?.maxCols
  return maxCols ? ordered.slice(0, maxCols) : ordered
}

export type CellFormat =
  | 'text'
  | 'money'
  | 'signedMoney'
  | 'price'
  | 'pct'
  | 'count'
  | 'signedCount'
  | 'rank'

export function cellFormat(column: string): CellFormat {
  const key = stripPrefix(column)

  if (
    /NetFlow|InFlow|OutFlow|ShortAmount|CapChg|(^|_)(Main|Retail)(In|Out)$/.test(
      key,
    )
  ) {
    return 'signedMoney'
  }

  if (
    /DealPrice|ClosePrice|closePrice|LastestTradedPrice|FwdClosePrice|^price$|BasicEPS|DilutedEPS|^EPS$|SalesPs|CashflowPS|MainincomePS|NetAssetPS|OperCashFlowPS|TangiableBPS|^BPS$|PerShare|cashDiviRMB|cashDivPerShare|^dividend$|specialDivPerShare/i.test(
      key,
    )
  ) {
    return 'price'
  }

  if (
    /Rate$|Ratio$|CircRate|HoldRatio|ProfitRate|Concentration|holdPct|holdingPct|^pct$|Margin$|^ROA$|^ROE$|RoeWeighted|Gr1y$|Gr3y$|tota$|totl$|totp$/.test(
      key,
    )
  ) {
    return 'pct'
  }

  if (/holdChange|changeShares/i.test(key)) return 'signedCount'

  if (
    /Shares$|HoldShares|^shares$|holdingShares|SHNum|totalSHNum|instCount|instIncreaseCount|ShortShares|ShortRecoverDays/.test(
      key,
    )
  ) {
    return 'count'
  }

  if (/Rank$/.test(key)) return 'rank'

  if (
    /Expense|Income|Asset|Liabilit|Cash|Profit|Revenue|Sales|Tax|Debt|Equity|Capex|Amount|Cost|EBIT|Payable|Receivable|Inventory|Loan|Invest|Dividend|Fund|Earning|Cogs|Borrow|Payment|Proceed|WorkingCapital|PPE|PreferedStock|Provision|GrossOper|MiscFund|FreeCF|DepCF|DivCF|DebtCF|AcqBusi|StockChg|Xord|SaleAssets|PurchaseSale|OtherFund|OtherFinance|NonCash|NetIncome|Affiliate|Consolidate|Pretax|Opercashtotp|BeginPeriod|Endperiod|Cashequivalent|Cashfr|CashReceipt|Subtic|Totalcash|VendCapital|Purcapital|SpeItems|Opepro|Payabled|Investpayment|InvestProceed|Exchar|Administration|FinancialCost|OperExpenses|SalesExpense|ProfitTo|SeWithout|ShareHolder|CommonStock|CumMinority|AdvancedInvestment|CashShort|FixedAssets|ConstruInProcess|LongTerm|ShortTerm|DeferTax|DeferredTax|OtherCurrent|OtherNonCurrent|OtherAssets|OtherLiabilit|TotalAccount|TotalEquity|TotalLiability|CurrentAsset|CurrentLiabilit|NonCurrent|Intangible|Inventories|InvestmentProperty|CapitalReserve|SurplusReserve|PaidIn|Retained|Salaries|Contract|AdvancePayment|BillAcc|BoughtSell|Lease|ReceivablesFin|TConstru|InterestBear|NPDeduct|NPParent|Operating|TotalOperating|TotalAdmin|TotalFixed|TotalProfit|TotalAsset|NetOperate|NetInvest|NetFinance|NetCash|GoodsSale|FCFE|FCFF|CFF|CFI|CFO|Capex|CashChg|WorkingCapitalChg|totalCashDivi|CashDivi/.test(
      key,
    )
  ) {
    return 'money'
  }

  return 'text'
}
