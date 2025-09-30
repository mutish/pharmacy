"use strict";

export async function up(queryInterface) {
    await queryInterface.bulkInsert("Carts", [
        {
            id: "77777777-7777-1111-1111-111111111111",
            userId: "b1f77f0e-b6d2-42db-9e42-f1a4af6e1111", 
            productId: "b2a77f4c-a9d2-4bc9-8822-f9b64e8f4444",
            quantity: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ]);
}
export async function down(queryInterface) {
    await queryInterface.bulkDelete("Carts", null, {});
}
