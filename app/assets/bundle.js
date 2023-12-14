// @ts-nocheck
const API_URL = 'https://114c-181-31-154-153.ngrok-free.app'
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
  ) ?? [];}


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
  console.log('70', discountResponse)
}

const applyAndSave = async (listDiscountsData, cartData) => {
  const submitButton = document.getElementById('rivka-app-discount-code-submit');
  const errorMessage = document.querySelector('.stack-discounts-message');
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
      setTimeout(() => {
        updateCartDrawerUI(newTempDiscountInfo.code);
      }, 2000);
    }
  } else {
    errorMessage.style.display = 'block';
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 3000);
    console.error('listDiscountsData undefined')
    console.error(listDiscountsData)
  }
}

const handleUpdateDiscount = async () => {
  const cartData = await retrieveCartData()
  const { newTempDiscountInfo: discountApplied } = JSON.parse(localStorage.getItem('rivka-discount-applied'))

  const listDiscountsResponse = await fetch(`${API_URL}/api/update_temporary_discount`, {
    method: "POST",
    body: JSON.stringify({
      addedCode: discountApplied.code,
      cartProducts: parseCartData(cartData)
    })
  })

  const listDiscountsData = await listDiscountsResponse.json()

  applyAndSave(listDiscountsData, cartData);
}

const handleApplyDiscount = async (e) => {
  const cartData = await retrieveCartData()

  // fetch('https://b73f-181-31-154-153.ngrok-free.app/api/apply_discount')
  const listDiscountsResponse = await fetch(`${API_URL}/api/apply_temporary_discount`, {
    method: "POST",
    body: JSON.stringify({
      addedCode: document.getElementById('rivka-app-discount-code-input')?.value ?? '',
      cartProducts: parseCartData(cartData)
    })
  })

  const listDiscountsData = await listDiscountsResponse.json();

  applyAndSave(listDiscountsData, cartData, e.target.id);
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const updateTotalPrice = async () => {
  const cartData = await retrieveCartData();
  const input = document.querySelector('#rivka-app-discount-code-input')
  const subTotal = document.querySelector('.cart__item--subtotal');
  const drawerSubTotal = document.querySelector('.cart-drawer__item--subtotal');
  const submitButton = document.getElementById('rivka-app-discount-code-submit');
  let finalPrice = cartData.original_total_price;
  if(cartData.total_discount > 0) {
    finalPrice = cartData.original_total_price - cartData.total_discount;
  }
  const formattedFinalprice = formatter.format(finalPrice / 100);
  const formattedTotalPrice = formatter.format(cartData.original_total_price / 100);

  const priceDiv = document.createElement('div');
  let htmlPrice = ``;
  if(cartData.total_discount > 0) {
    htmlPrice = `
      <div>Subtotal</div>
      <div>
        <span class="striked-price">${formattedTotalPrice}</span>
        <span>${formattedFinalprice}</span>
      </div>
    `
  } else {
    htmlPrice = `
      <div>Subtotal</div>
      <div>
        <span>${formattedTotalPrice}</span>
      </div>
    `
  }

  priceDiv.classList.add('cart-drawer__item--subtotal');
  priceDiv.innerHTML = htmlPrice;
  drawerSubTotal?.remove();
  subTotal?.insertAdjacentElement('afterend', priceDiv);
  input.value = '';
  submitButton.classList.remove('loading');
  submitButton.disabled = false;
}
const updateCartDrawerUI = async (tempCode) => {
  const cartData = await retrieveCartData();

  const discountAppliedDiv = document.querySelector('.discount_applied');
  const discountTitleDiv = document.querySelector('.discount-title');
  const dcWrapperDiv = document.querySelector('.dc_wrapper');
  const discountCodesDiv = document.querySelector('.discount__codes');
  const codeParts = tempCode.split("-");

  const codesDiv = document.createElement('div');
  codesDiv.classList.add('dc_wrapper');
  const htmlCodes = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="17" height="17">
      <path d="M17.78 3.09C17.45 2.443 16.778 2 16 2h-5.165c-.535 0-1.046.214-1.422.593l-6.82 6.89c0 .002 0 .003-.002.003-.245.253-.413.554-.5.874L.738 8.055c-.56-.953-.24-2.178.712-2.737L9.823.425C10.284.155 10.834.08 11.35.22l4.99 1.337c.755.203 1.293.814 1.44 1.533z" fill-opacity=".55"></path>
      <path fill-opacity=".25" d="M10.835 2H16c1.105 0 2 .895 2 2v5.172c0 .53-.21 1.04-.586 1.414l-6.818 6.818c-.777.778-2.036.782-2.82.01l-5.166-5.1c-.786-.775-.794-2.04-.02-2.828.002 0 .003 0 .003-.002l6.82-6.89C9.79 2.214 10.3 2 10.835 2zM13.5 8c.828 0 1.5-.672 1.5-1.5S14.328 5 13.5 5 12 5.672 12 6.5 12.672 8 13.5 8z"></path>
    </svg>
    <span>${codeParts[1]}</span>
    <div id="delete__discount">
      <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="Menu / Close_SM">
        <path id="Vector" d="M16 16L12 12M12 12L8 8M12 12L16 8M12 12L8 16" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
        </g>
      </svg>
    </div>
  `;
  codesDiv.innerHTML = htmlCodes;

  const div = document.createElement('div');
  const html = `
  <div><svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="tags" class="svg-inline--fa fa-tags fa-w-20" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M497.941 225.941L286.059 14.059A48 48 0 0 0 252.118 0H48C21.49 0 0 21.49 0 48v204.118a48 48 0 0 0 14.059 33.941l211.882 211.882c18.744 18.745 49.136 18.746 67.882 0l204.118-204.118c18.745-18.745 18.745-49.137 0-67.882zM112 160c-26.51 0-48-21.49-48-48s21.49-48 48-48 48 21.49 48 48-21.49 48-48 48zm513.941 133.823L421.823 497.941c-18.745 18.745-49.137 18.745-67.882 0l-.36-.36L527.64 323.522c16.999-16.999 26.36-39.6 26.36-63.64s-9.362-46.641-26.36-63.64L331.397 0h48.721a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882z"></path></svg>
  <span>Discount applied</span></div><span>${formatter.format(cartData.total_discount / 100)}</span>
  `;

  div.classList.add('discount-title');
  div.innerHTML = html;
  setTimeout(() => {
    updateTotalPrice();
  }, 2000);
  discountCodesDiv?.appendChild(codesDiv);
  discountTitleDiv?.remove();
  dcWrapperDiv?.remove();
  await discountAppliedDiv.appendChild(div);
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
    e.target.classList.add('loading');
    e.target.disabled = true;
    handleApplyDiscount(e)
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

/* if(localStorage.getItem('openCart')) {

  document.querySelector('cart-drawer').classList.add('animate', 'active')
  localStorage.setItem('openCart', false)
} */

// Function to update the UI based on the localStorage data
const updateUIFromLocalStorage = async () => {
  const cartData = await retrieveCartData()
  const listDiscountsData = JSON.parse(localStorage.getItem('rivka-discount-applied'));
  const discountInfo = await listDiscountsData?.newTempDiscountInfo;

  if(cartData.total_discount === 0) {
    return updateTotalPrice();
  }
  if (discountInfo) {
    await updateCartDrawerUI(discountInfo.code);
  }
};

// Update the UI when the page loads
updateUIFromLocalStorage();

// Update the UI when the localStorage changes
window.addEventListener('storage', async (event) => {
  if (event.key === 'rivka-discount-applied') {
    await updateUIFromLocalStorage();
  }
});

console.log('Custom Discounts (Rivka): Loaded')
