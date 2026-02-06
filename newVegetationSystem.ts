// ... in processPlant ...

if (entity.energy >= fruitCost) {
    // ... energy deduction ...

    // MUTATION LOGIC
    let childGenomeId = entity.genomeId;
    
    // Prüfen, ob Mutation passiert (z.B. 10% Chance pro Samen)
    // Zugriff auf worldConfig nötig für mutationRate!
    if (rng() < 0.1) { 
        const parentGenome = genomes.get(entity.genomeId);
        if (parentGenome) {
            // 1. Neues Genom erstellen
            const mutatedGenome = mutateGenome(parentGenome, 0.1, rng);
            
            // 2. Als Event zurückgeben, damit der Main-Loop es registrieren kann?
            // Besser: Direktzugriff oder Callback. 
            // Da VegetationSystem keinen Zugriff auf "registerGenome" hat, 
            // müssen wir das Spawn-Event aufbohren.
            
            // HACK für jetzt: Wir brauchen Zugriff auf die Registry.
            // Sauberer Weg: VegetationSystem gibt nicht nur "spawns" zurück, 
            // sondern auch "newGenomes".
        }
    }

    spawns.push({
        type: 'SEED',
        genomeId: childGenomeId, // Hier könnte die NEUE ID stehen
        position: target,
    });
}