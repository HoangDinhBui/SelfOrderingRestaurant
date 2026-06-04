const orderId = 12; // Assuming from screenshot Order 12
const dishId = 1; // Need a valid dishId
const status = "PROCESSING";

fetch('http://localhost:8080/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `mutation {
      updateOrderItemStatus(orderId: "${orderId}", dishId: "${dishId}", status: "${status}") {
        orderId
        status
        items {
          dishId
          status
        }
      }
    }`
  })
}).then(r => r.json()).then(data => {
  console.log("Mutation response:", JSON.stringify(data, null, 2));
}).catch(console.error);
