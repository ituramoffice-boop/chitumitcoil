// DTI / Liabilities Calculation
// EXCLUDES: credit card spending (דירקט, codes 4153/6147)
// INCLUDES: real loans only (הו"ק הלואה, code 469)

interface Transaction {
  description: string;
  reference_code?: string;
  amount: number;
  type: "debit" | "credit";
}

const EXCLUDED_DESCRIPTIONS = ["דירקט- מצטבר", "דירקט -מצטבר", "דירקט-מצטבר"];
const EXCLUDED_CODES = ["4153", "6147"];
const LOAN_DESCRIPTIONS = ['הו"ק הלואה', "הוק הלואה", "הלוואה קרן"];
const LOAN_CODES = ["469"];

export function calculateTotalLiabilities(transactions: Transaction[]): number {
  const liabilities = transactions.filter((tx) => {
    if (tx.type !== "debit") return false;

    // Exclude credit card / דירקט transactions
    const isExcludedDesc = EXCLUDED_DESCRIPTIONS.some((excl) =>
      tx.description?.includes(excl)
    );
    const isExcludedCode = EXCLUDED_CODES.includes(tx.reference_code || "");
    if (isExcludedDesc || isExcludedCode) return false;

    // Only include actual loans
    const isLoanDesc = LOAN_DESCRIPTIONS.some((loan) =>
      tx.description?.includes(loan)
    );
    const isLoanCode = LOAN_CODES.includes(tx.reference_code || "");
    return isLoanDesc || isLoanCode;
  });

  return liabilities.reduce((sum, tx) => sum + tx.amount, 0);
}

export function calculateDTI(
  monthlyLiabilities: number,
  monthlyIncome: number
): number {
  if (!monthlyIncome || monthlyIncome === 0) return 0;
  return parseFloat(((monthlyLiabilities / monthlyIncome) * 100).toFixed(1));
}

// Salary Extraction - EXCLUDES מסגרת, only uses recurring inbound credits

const SALARY_EXCLUSION_PHRASES = [
  "מסגרת משכורת",
  "מסגרת",
  "אשראי",
  "הלוואה",
];

const SALARY_INCLUSION_PHRASES = [
  "משכורת",
  "שכר",
  "זיכוי שכר",
  "העברה נכנסת",
];

export function extractVerifiedSalary(transactions: Transaction[]): number {
  const incomingCredits = transactions.filter((tx) => {
    if (tx.type !== "credit") return false;

    // Exclude anything with מסגרת or credit-limit keywords
    const isExcluded = SALARY_EXCLUSION_PHRASES.some((phrase) =>
      tx.description?.includes(phrase)
    );
    if (isExcluded) return false;

    // Only include transactions that look like salary
    const isSalary = SALARY_INCLUSION_PHRASES.some((phrase) =>
      tx.description?.includes(phrase)
    );
    return isSalary;
  });

  if (incomingCredits.length === 0) return 0;

  // Return the most common/recurring amount (mode), or average if all unique
  const amounts = incomingCredits.map((tx) => tx.amount);
  const frequency: Record<number, number> = {};
  amounts.forEach((a) => (frequency[a] = (frequency[a] || 0) + 1));
  const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
  return parseFloat(sorted[0][0]); // Most frequent salary amount
}
