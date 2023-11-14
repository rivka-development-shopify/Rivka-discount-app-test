// @ts-nocheck
const API_URL = 'https://fc2a-181-31-154-153.ngrok-free.app'
const retrieveCartData = async () => {
  const cart =  await $.ajax({
    type: 'GET',
    url: '/cart.js',
    cache: false,
    dataType: 'json',
  });

  return cart?.items.map(
    item => {
      return {
        productId: `gid://shopify/Product/${item.product_id}`,
        productVariantId: `gid://shopify/ProductVariant/${item.id}`
      }
    }
  ) ?? [];
}

const updateCartPrices = (productDiscountedPrices) => {
  console.log(productDiscountedPrices)
}

const handleApplyDiscount = async () => {
  data = {
    addedCode: document.getElementById('rivka-app-discount-code-input')?.value ?? '',
    cartProducts: await retrieveCartData()
  }

  // fetch('https://b73f-181-31-154-153.ngrok-free.app/api/apply_discount')
  fetch(`${API_URL}/api/list_all_discounts`, {
    method: "POST",
    body: JSON.stringify(data)
  })
    .then((response) => {
      return response.json();
    })
    .then((jsonResponse) => {
      updateCartPrices(jsonResponse?.body?.data?.productDiscountedPrices ?? null)
    });
}


const createForm = () => {
  // CREATING ELEMENTS
  const div = document.getElementById('discount-app-input')
  const input = document.createElement('input')
  const button = document.createElement('button')

  input.type = 'text'
  input.id = 'rivka-app-discount-code-input'
  button.id = 'rivka-app-discount-code-submit'

  button.onclick = handleApplyDiscount
  button.appendChild(document.createTextNode('GO!'))
  div.appendChild(input)
  div.appendChild(button)
}


createForm()
