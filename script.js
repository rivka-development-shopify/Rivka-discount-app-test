fetch(
  `https://9533-181-31-154-153.ngrok-free.app/api/delete_expired_temporary_discount?publicAuthKey=24b0ej97yu0cjkovcp356z8snvj0g1w8`,
  {
    method: "DELETE",
    headers: {}
  }
).then(response => response.json()).then(data => console.log(data))
