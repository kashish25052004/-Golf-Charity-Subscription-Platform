export function calculateSubscriptionAmount(plan) {
  return plan === "yearly" ? 299 : 29;
}

export function calculateCharityContribution(subscriptionAmount, charityPercentage) {
  return Number(((subscriptionAmount * charityPercentage) / 100).toFixed(2));
}
