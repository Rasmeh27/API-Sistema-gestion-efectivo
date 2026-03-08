import bcrypt from "bcryptjs";

async function main() {
  const plainPassword = "Admin123*";
  const hash = await bcrypt.hash(plainPassword, 10);

  console.log("password:", plainPassword);
  console.log("hash:", hash);
}

main().catch(console.error);