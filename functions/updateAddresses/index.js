const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()

exports.handle = function (e, ctx) {
  if (validate(e.userid, 4) === false) {
    return ctx.fail('Invalid userid supplied')
  }
  if (!e.body || !e.body.addresses || Array.isArray(e.body.addresses) === false || e.body.addresses.length > 25) {
    return ctx.fail('Invalid body supplied')
  }
  const puts = []
  let itemError = false
  e.body.addresses.forEach((i) => {
    if (validate(i._id, 4) !== true || i.tscs.length > 100) {
      itemError = true
    }
    const putItem = {
      PutRequest: {
        Item: {
          _id: {
            S: i._id
          },
          userid: {
            S: e.userid
          },
          data: {
            S: i.data
          }
        }
      }
    }
    if (i.tscs.length > 0) {
      putItem.PutRequest.Item.tscs = {
        SS: i.tscs
      }
    }
    puts.push(putItem)
  })
  if (itemError === true) {
    return ctx.fail('Invalid body supplied')
  }
  dynamodb.batchWriteItem({
    RequestItems: {
      'bk_addresses': puts
    },
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE'
  }, (err, result) => {
    if (err) {
      console.log(err)
      return ctx.fail('Error')
    }
    if (result && Object.keys(result.UnprocessedItems).length !== 0) {
      return ctx.fail('Error UnprocessedItems')
    }
    ctx.succeed()
  })
}