const fs = require('fs');

function saveWorld(context) {
    fs.writeFile("userworlds/" + context.user + "-world.json", JSON.stringify(context.world), err => {
        if (err) {
            console.error(err)
            throw new Error(`Erreur d'écriture du monde coté serveur`)
        }
    })
}

//mutations
async function acheterQtProduit(parent, args, context) {
    update(context)

    //Récuperation
    let id = args.id
    let quantite = args.quantite

    let products = context.world.products
    let index = products.findIndex(x => x.id === id)
    if(index === null || false) {
        throw new Error(`Le produit avec l'id ${args.id} n'existe pas`)
    }

    //Actions
    // modify quantite
    context.world.products[index].quantite = products[index].quantite + quantite
    // money
    context.world.money = context.world.money - products[index].cout
    // cout
    context.world.products[index].cout = Math.floor(sumOfGeometricSeries(context.world.products[index].cout, products[index].croissance, 2))

    //Sauvegarde
    saveWorld(context)
    return products[index]
}

function lancerProductionProduit(parent, args, context) {
    update(context)

    let id = args.id
    let quantite = args.quantite

    let products = context.world.products
    let index = products.findIndex(x => x.id === id)
    if(index === null || false) {
        throw new Error(`Le produit avec l'id ${args.id} n'existe pas`)
    }

    context.world.products[index].timeleft = context.world.products[index].vitesse

    saveWorld(context)
    return products[index]
}

function engagerManager(parent, args, context){
    update(context)

    //Récuperations
    let id = args.id

    let managers = context.world.managers
    let indexManager = managers.findIndex(x => x.id === id)
    if(indexManager === null || false) {
        throw new Error(`Le manager avec l'id ${args.id} n'existe pas`)
    }
    let products = context.world.products
    let indexProduct = products.findIndex(x => x.id === managers[indexManager].idcible)

    //Actions
    // modify managerUnlock
    context.world.products[indexProduct].managerUnlocked = true

    // modify unlocked
    context.world.managers[indexManager].unlocked = true

    //Sauvegarde
    saveWorld(context)
    return {manager: managers[indexManager], product: products[indexProduct]}
}

module.exports = {
    Query: {
        getWorld(parent, args, context) {
            saveWorld(context)
            return context.world
        }
    },
    Mutation: {acheterQtProduit, lancerProductionProduit, engagerManager}
};

//Privates
function sumOfGeometricSeries(firstTerm, commonRatio, noOfTerms) {
    var result = 0;
    for (let i=0; i<noOfTerms; i++)
    {
        result = result + firstTerm;
        firstTerm = firstTerm * commonRatio;
    }
    return result;
}

function update(context){
    //Récuperation
    let world = context.world
    let products = world.products

    let money = 0
    let tempsEcoule = Date.now() - parseInt(context.world.lastupdate)

    //Actions
    products.foreach(x=> {
        let exemplaire = 0
        let tempsEcouleProduit = x.timeleft - tempsEcoule
        if(x.managerUnlocked) {
            exemplaire = tempsEcoule%x.vitesse
        } else if(x.timeleft !== 0 && x.timeleft < tempsEcoule) {
            exemplaire = 1
        }
        x.timeleft = tempsEcoule - exemplaire*x.vitesse
    })
    context.world.money += money
    context.score += money
    context.world.lastupdate = Date.now().toString()

    //Sauvegarde
    saveWorld(context)
    return context
}
