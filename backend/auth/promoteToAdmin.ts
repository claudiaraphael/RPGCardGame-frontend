// ==========================================================
// SCRIPT: promove um usuário existente a admin
// ==========================================================
// Script avulso (não faz parte do servidor), rodado à mão:
//   npx ts-node auth/promoteToAdmin.ts email@exemplo.com
//
// De propósito NÃO existe rota HTTP equivalente — se existisse, um usuário
// comum só precisaria descobrir o endpoint pra se autopromover a admin.
// Promoção fica restrita a quem tem acesso ao servidor/banco.

import { userRepository } from "./userRepository";

const email = process.argv[2];

if (!email) {
  console.error("Uso: npx ts-node auth/promoteToAdmin.ts <email>");
  process.exit(1);
}

const user = userRepository.findByEmail(email);

if (!user) {
  console.error(`Nenhum usuário encontrado com o e-mail "${email}".`);
  process.exit(1);
}

if (user.role === "admin") {
  console.log(`"${email}" já é admin.`);
  process.exit(0);
}

userRepository.update(user.id, { role: "admin" });
console.log(`"${email}" agora é admin.`);
