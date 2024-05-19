exports = async function (changeEvent) {
  // A Database Trigger will always call a function with a changeEvent.
  // Documentation on ChangeEvents: https://www.mongodb.com/docs/manual/reference/change-events

  // This sample function will listen for events and replicate them to a collection in a different Database

  // Access the _id of the changed document:
  const docId = changeEvent.documentKey._id;

  // Get the MongoDB service you want to use (see "Linked Data Sources" tab)
  const serviceName = "mongodb-atlas";
  const databaseName = "Reports";
  const consolidatedExpenses = "consolidatedExpenses";

  const consolidatedExpensesColl = context.services.get(serviceName).db(databaseName).collection(consolidatedExpenses);

  //instance of Expenses
  const expensesColl = context.services.get(serviceName).db(databaseName).collection(changeEvent.ns.coll);

  // Get the "FullDocument" present in the Insert/Replace/Update ChangeEvents
  try {
    // If this is a "delete" event, delete the document in the other collection
    if (changeEvent.operationType === "delete") {
      await expensesColl.deleteOne({ "_id": docId });
    }

    // If this is an "insert" event, insert the document into the other collection
    else if (changeEvent.operationType === "insert") {

      var dateRegistered = changeEvent.fullDocument.dateRegistered; // Extracting the date string
      var year = new Date(dateRegistered).getFullYear(); // Extracting the year from the date
      var month = new Date(dateRegistered).getMonth() + 1; // Extracting the month from the date (adding 1 because month is zero-based)

      await consolidatedExpensesColl.updateOne(
        { "client": changeEvent.fullDocument.client, "year": year, "month": month },
        { $inc: { "total": changeEvent.fullDocument.detail.total } },
        { upsert: true }
      );
      //await expensesColl.insertOne(changeEvent.fullDocument);
    }


  } catch (err) {
    console.log("error performing mongodb write: ", err.message);
  }
};