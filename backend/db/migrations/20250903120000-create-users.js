"use strict"; 

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Users", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
      primaryKey: true,
    },
    name: { type: Sequelize.STRING, allowNull: false },
    email: { type: Sequelize.STRING, unique: true, allowNull: false },
    password: { type: Sequelize.STRING, allowNull: false },
    role: {
      type: Sequelize.ENUM("user", "pharmacist", "admin"),
      defaultValue: "user",
    },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
  });
}
export async function down(queryInterface) {
  await queryInterface.dropTable("Users");
}
