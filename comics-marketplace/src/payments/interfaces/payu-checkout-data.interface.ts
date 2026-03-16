// payu checkout form data to redirect user to payment page
export interface PayUCheckoutData {
  formUrl: string;
  params: {
    merchantId: string;
    accountId: string;
    description: string;
    referenceCode: string;
    amount: string;
    currency: string;
    signature: string;
    tax: string;
    taxReturnBase: string;
    buyerEmail: string;
    buyerFullName: string;
    responseUrl: string;
    confirmationUrl: string;
  };
}
