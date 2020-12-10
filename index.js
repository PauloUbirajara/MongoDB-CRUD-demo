const { MongoClient } = require('mongodb');

async function main() {
	const uri = 'mongodb+srv://admin:admin@spotify.cdkdr.mongodb.net/Spotify?retryWrites=true&w=majority';
	const options = {
		useNewUrlParser: true,
		useUnifiedTopology: true
	};

	const client = new MongoClient(uri, options);
	try {
		await client.connect();

		//@ CREATE
		// await createListing(client, listing);
		// await createMultipleListings(client, listings)

		//@ READ
		// await listDatabases(client);
		// const listing = {
		// 	name: "Lovely Loft",
		// 	summary: "A charming loft in Paris",
		// 	bedrooms: 1,
		// 	bathrooms: 1
		// }
		// const listings = [
		// 	{
		// 		name: "Lovely Loft",
		// 		summary: "A charming loft in Paris",
		// 		bedrooms: 3,
		// 		bathrooms: 4
		// 	},
		// 	{
		// 		name: "Nice Place",
		// 		summary: "Nice summary for a nice place!",
		// 		bedrooms: 1,
		// 		bathrooms: 2
		// 	},
		// 	{
		// 		name: "Nice Place",
		// 		summary: "Nice summary for a nice place!",
		// 		bedrooms: 2,
		// 		bathrooms: 1
		// 	},
		// ]

		// await findOneListingByName(client, 'Nice Place 4');

		// await findListingsWithMinimumBedroomsBathroomsAndMostRecentReviews(client, {
		// 	minimumNumberOfBathrooms: 4,
		// 	minimumNumberOfBedrooms: 2,
		// 	maximumNumberOfResults: 5
		// });

		//@ UPDATE
		// await updateListingByName(client, 'Nice Place', {
		// 	name: "Nice Place 2",
		// 	summary: "Nice summary for a nice place 2!",
		// 	bedrooms: 3,
		// 	bathrooms: 2
		// });

		// await upsertListingByName(client, 'Nice Place 3', {
		// 	name: "Nice Place 4",
		// 	bedrooms: 3,
		// 	bathrooms: 2
		// })

		// await updateAllListingsToHavePropertyType(client);

		//@ DELETE
		// await deleteListingByName(client, 'Nice Place');
		// await deleteListingsScrapedBeforeDate(client, new Date('2019-02-15'));

	} catch (e) {
		console.error(e);
	}

	await client.close();
}

main().catch(console.error);

//@ CREATE
//> Insere no db selecionado UM objeto
async function createListing(client, newListing) {
	const result = await client.db('sample_airbnb').collection('listingsAndReviews').insertOne(newListing);

	// console.log(result);
	console.log(`New listing created with the following id: ${result.insertedId}`);
}

//> Insere no db selecionado MULTIPLOS objetos
async function createMultipleListings(client, newListings) {
	const result = await client.db('sample_airbnb').collection('listingsAndReviews').insertMany(newListings);

	console.log(`${result.insertedCount} new listings(s) created with the following id(s):`);
	console.log(result.insertedIds);
}

//@ READ
//> Ler todos os nomes dos bancos de dados
async function listDatabases(client) {
	const databasesList = await client.db().admin().listDatabases();

	console.log(`Databases: `);
	databasesList.databases.forEach(db => { console.log(`- ${db.name}`) });
}

//> Procurar um registro por nome
async function findOneListingByName(client, nameOfListing) {
	const result = await client.db('sample_airbnb').collection('listingsAndReviews').findOne({ name: nameOfListing });

	if (result) {
		console.log(`Found a listing in the collection with the name '${nameOfListing}'`);
		console.log(result);
		return;
	}

	console.log(`No listings found with the name '${nameOfListing}'`);
}

//> Procurar registros com filtragem
async function findListingsWithMinimumBedroomsBathroomsAndMostRecentReviews(client, {
	minimumNumberOfBedrooms = 0,
	minimumNumberOfBathrooms = 0,
	maximumNumberOfResults = Number.MAX_SAFE_INTEGER
} = {}) {
	const cursor = client.db('sample_airbnb').collection('listingsAndReviews').find({
		bedrooms: { $gte: minimumNumberOfBedrooms },
		bathrooms: { $gte: minimumNumberOfBathrooms }
	})
		.sort({ last_review: -1 })
		.limit(maximumNumberOfResults);

	const result = await cursor.toArray();

	if (result.length) {
		console.log(`Found listing(s) with at least ${minimumNumberOfBedrooms} bedroom(s) and ${minimumNumberOfBathrooms} bathroom(s):`);
		result.forEach((result, i) => {
			const date = new Date(result.last_review).toDateString();

			console.log();

			console.log(`${i + 1}. name: ${result.name}`);
			console.log(`   -> _id: ${result._id}`);
			console.log(`   -> bedrooms: ${result.bedrooms}`);
			console.log(`   -> bathrooms: ${result.bathrooms}`);
			console.log(`   -> most recent review date${date}`);
		});
		return;
	}

	console.log(`No listing(s) found with at least ${minimumNumberOfBedrooms} bedroom(s) and ${minimumNumberOfBathrooms} bathroom(s)!`);
}

//@ UPDATE
//> Atualiza UM registro por filtro e troca com as novas informações inseridas
async function updateListingByName(client, nameOfListing, updatedListing) {
	const result = await client.db('sample_airbnb').collection('listingsAndReviews').updateOne(
		{ name: nameOfListing },
		{ $set: updatedListing }
	);

	console.log(`${result.matchedCount} document(s) matched the query criteria`);
	console.log(`${result.modifiedCount} document(s) was/were updated`);
}

//> Atualiza UM registro por filtro se existir, senão insere no banco de dados
async function upsertListingByName(client, nameOfListing, updatedListing) {
	const result = await client.db('sample_airbnb').collection('listingsAndReviews').updateOne(
		{ name: nameOfListing },
		{ $set: updatedListing },
		{ upsert: true }
	);

	console.log(`${result.matchedCount} document(s) matched the query criteria`);

	if (result.upsertedCount > 0) {
		console.log(`One document was inserted with the id ${result.upsertedId._id}`);
		return;
	}

	console.log(`${result.modifiedCount} document(s) was/were updated`);
}

//> Atualiza MULTIPLOS registros por filtro e troca com as novas informações inseridas
async function updateAllListingsToHavePropertyType(client) {
	const result = await client.db('sample_airbnb').collection('listingsAndReviews')
		.updateMany(
			{ property_type: { $exists: false } }, // Verifica se existe, senão cria como "Unknown"
			{ $set: { property_type: "Unknown" } });

	console.log(`${result.matchedCount} document(s) matched the query criteria`);
	console.log(`${result.modifiedCount} document(s) was/were updated`);
}

//@ DELETE
//> Deleta UM registro de acordo com um filtro
async function deleteListingByName(client, nameOfListing) {
	const result = await client.db('sample_airbnb').collection('listingsAndReviews')
		.deleteOne({ name: nameOfListing });

	console.log(`${result.deletedCount} document(s) was/were deleted!`);
}

async function deleteListingsScrapedBeforeDate(client, date) {
	const result = await client.db('sample_airbnb').collection('listingsAndReviews')
		.deleteMany({
			'last_scraped': { $lt: date }
		});

	console.log(`${result.deletedCount} document(s) was /were deleted!`);
}