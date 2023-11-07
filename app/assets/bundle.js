// @ts-nocheck
const API_URL = 'https://b73f-181-31-154-153.ngrok-free.app'
const handleApplyDiscount = () => {
  data = {
    "addedCode":"231010",
    "cartProducts":[
      {
        "productId": "gid://shopify/Product/7762367611032",
        "productVariantId": "gid://shopify/ProductVariant/42914666119320"
      },
      {
        "productId": "gid://shopify/Product/7762367611032",
        "productVariantId": "gid://shopify/ProductVariant/42914666152088"
      },{
        "productId": "gid://shopify/Product/7762367512728",
        "productVariantId": "gid://shopify/ProductVariant/42914665955480"
      }
    ]
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
      console.log(jsonResponse);
    });
}

// CREATING ELEMENTS
const div = document.getElementById('discount-app-input')
const input = document.createElement('input')
const button = document.createElement('button')

input.type = 'text'
input.id = 'discount-code'
button.id = 'discount-code-submit'

button.onclick = handleApplyDiscount
button.appendChild(document.createTextNode('GO!'))
div.appendChild(input)
div.appendChild(button)
