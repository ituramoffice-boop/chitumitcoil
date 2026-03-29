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
