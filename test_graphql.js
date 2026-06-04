fetch('http://localhost:8080/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: '{ orders { orderId status items { dishId status } } }'
  })
}).then(r => r.json()).then(console.log).catch(console.error);
