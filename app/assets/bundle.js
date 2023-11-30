// @ts-nocheck
const API_URL = 'https://rivkacustomdiscounts.tech'
const retrieveCartData = async () => {
  return await $.ajax({
    type: 'GET',
    url: '/cart.js',
    cache: false,
    dataType: 'json',
  });
}

const parseCartData = (rawCartData) => {
  return rawCartData?.items.map(
    item => {
      return {
        productId: `gid://shopify/Product/${item.product_id}`,
        productVariantId: `gid://shopify/ProductVariant/${item.id}`,
        quantity: item.quantity
      }
    }
  ) ?? [];
}

const applyDiscount = async (code, cartData) => {
  try {
    const paymentsConfigResponse = await fetch("/payments/config", {"method": "GET"})
    const paymentsConfigData = await paymentsConfigResponse.json()
    authorization_token = btoa(paymentsConfigData.paymentInstruments.accessToken)

    let body = {"checkout": { "country": Shopify.country,"discount_code": code,"line_items": cartData.items, 'presentment_currency': Shopify.currency.active } }

    const walletsCheckoutResponse = await fetch(
      '/wallets/checkouts/',
      {
      "headers": {
        "accept": "*/*", "cache-control": "no-cache",
        "authorization": "Basic " + authorization_token,
        "content-type": "application/json, text/javascript",
        "pragma": "no-cache", "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin"
      },
      "referrerPolicy": "strict-origin-when-cross-origin",
      "method": "POST", "mode": "cors", "credentials": "include",
      "body": JSON.stringify(body)
      }
    )

    const walletsCheckoutData = await walletsCheckoutResponse.json()
    console.log(walletsCheckoutData.checkout);

    if(walletsCheckoutData.checkout && walletsCheckoutData.checkout.applied_discounts.length > 0){
      let discountApplyUrl = "/discount/"+code+"?v="+Date.now()+"&redirect=/checkout/";
      fetch(discountApplyUrl, {}).then(function(response) { return response.text(); })
      let localStorageValue = {
        'code': code.trim(),
        'totalCart': walletsCheckoutData.checkout.total_line_items_price
      };
      localStorage.setItem("discountCode", JSON.stringify(localStorageValue));
    }else{
      localStorage.removeItem("discountCode");
    }
    return true
  } catch(e) {
    console.error(e)
    return null
  }
}

const updateCartPrices = (discountResponse) => {
  console.log(discountResponse)
}

const applyAndSave = async (listDiscountsData, cartData) => {
  if(
    (listDiscountsData?.body?.data?.newTempDiscountInfo ?? null)
    &&
    (listDiscountsData?.body?.data?.productDiscountedPrices ?? null)
  ) {
    if(await applyDiscount(
      listDiscountsData.body.data.newTempDiscountInfo.code,
      cartData
    )) {
      const { body: { data: { newTempDiscountInfo, productDiscountedPrices } } } = listDiscountsData;
      updateCartPrices({
        productDiscountedPrices,
        newTempDiscountInfo
      })
      await localStorage.setItem('rivka-discount-applied', JSON.stringify({
        productDiscountedPrices,
        newTempDiscountInfo
      }));
      await localStorage.setItem('openCart', true);
    }
  } else {
    console.error('listDiscountsData undefined')
    console.error(listDiscountsData)
  }
}

const handleUpdateDiscount = async () => {
  const cartData = await retrieveCartData()


  const { newTempDiscountInfo: discountApplied } = JSON.parse(localStorage.getItem('rivka-discount-applied'))

  console.log(discountApplied)

  const listDiscountsResponse = await fetch(`${API_URL}/api/update_temporary_discount`, {
    method: "POST",
    body: JSON.stringify({
      addedCode: discountApplied.code,
      cartProducts: parseCartData(cartData)
    })
  })

  const listDiscountsData = await listDiscountsResponse.json()

  applyAndSave(listDiscountsData, cartData).then(
    () => {
      setTimeout(() => {location.reload()}, 500)
    }
  )
}

const handleApplyDiscount = async (cookieDiscountCode = null) => {
  const cartData = await retrieveCartData()

  console.log(cartData)

  // fetch('https://b73f-181-31-154-153.ngrok-free.app/api/apply_discount')
  const listDiscountsResponse = await fetch(`${API_URL}/api/apply_temporary_discount`, {
    method: "POST",
    body: JSON.stringify({
      addedCode: document.getElementById('rivka-app-discount-code-input')?.value ?? '',
      cartProducts: parseCartData(cartData)
    })
  })

  const listDiscountsData = await listDiscountsResponse.json()

  applyAndSave(listDiscountsData, cartData).then(
    () => {
      setTimeout(() => {location.reload()}, 500)
    }
  )
}


const createForm = () => {
  // CREATING ELEMENTS
  const div = document.getElementById('discount-app-input')
  const input = document.createElement('input')
  const button = document.createElement('button')

  input.type = 'text'
  input.id = 'rivka-app-discount-code-input'
  button.id = 'rivka-app-discount-code-submit'

  button.onclick = (e) => {
    e.preventDefault()
    handleApplyDiscount()
  }
  button.appendChild(document.createTextNode('Apply!'))
  input.placeholder = 'Ex: 12345678...'
  div.appendChild(input)
  div.appendChild(button)
}

const observeCartChanges = () => {
  const cartObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      const isValidRequestType = ['xmlhttprequest', 'fetch'].includes(entry.initiatorType);
      const isCartChangeRequest = /\/cart\//.test(entry.name);
      if (isValidRequestType && isCartChangeRequest) {
        handleUpdateDiscount()
      }
    });
  });
  cartObserver.observe({ entryTypes: ["resource"] });
}


createForm()
observeCartChanges()

if(localStorage.getItem('openCart')) {

  document.querySelector('cart-drawer').classList.add('animate', 'active')
  localStorage.setItem('openCart', false)
}

console.log('Custom Discounts (Rivka): Loaded')
