fetch(
  `https://rivkacustomdiscounts.tech/api/delete_expired_temporary_discount?publicAuthKey=uvldk4w973b29o4h6uzqjjgej981nntc`,
  {
    method: "DELETE",
    headers: {}
  }
).then(response => response.json()).then(data => console.log(data))
