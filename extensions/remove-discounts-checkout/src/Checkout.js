import { extension } from "@shopify/ui-extensions/checkout";

export default extension("purchase.checkout.block.render", (root, api) => {
  const { discountCodes, storage } = api;

  const API_URL = 'https://rivkacustomdiscounts.tech';

  fetch(
    `${API_URL}/api/temp_discounts?publicAuthKey=24b0ej97yu0cjkovcp356z8snvj0g1w8`,
    {
      method: 'GET',
      redirect: 'follow',
      mode: 'cors', // defaults to same-origin
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.36.0'
      },
    }
  )
  .then(response => response.json())
  .then(({ body }) => storage.write('our-discounts', body.data.tempDiscounts));


  const flagOurSystemDiscountRemoved = () => {
    storage.write('remove-rivka-discount', true)
  }

  const isDiscountOurs = async (discountCode) => {
    try {
      const ourDisocunts = await storage.read('our-discounts')
      return ourDisocunts.includes(discountCode);
    } catch (e) {
      console.error('Unable to read checkout extentionStorage')
      return false
    }
  }


  root.mount().then(() => {
    console.log('Remove Discounts Checkout: loaded')
    let storedDiscounts = [...discountCodes.current.map(discountCode => discountCode.code)];

    setInterval(
      () => {
        const updatedDiscounts = [...discountCodes.current.map(discountCode => discountCode.code)];

        if(updatedDiscounts.length < storedDiscounts.length) {
          console.log("discount removed")
          const removedDiscount = storedDiscounts.find(discountCode => (!updatedDiscounts.includes(discountCode)))
          storedDiscounts = [...updatedDiscounts]
          isDiscountOurs(removedDiscount).then(isOurs => {
            if(isOurs) {
              flagOurSystemDiscountRemoved(removedDiscount)
            }
          });
        } else if (updatedDiscounts.length > storedDiscounts.length) {
          console.log("discount added")
          storedDiscounts = [...updatedDiscounts]
        }
      }, 1000
    )
  })
});
