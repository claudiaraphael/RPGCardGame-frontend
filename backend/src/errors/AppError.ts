// ==========================================================
// ERRO DE APLICAÇÃO: erros "esperados", com status HTTP e mensagem segura
// ==========================================================
// Hoje cada rota decide na mão o que responder pra cada erro (400/404/409
// espalhados pelas rotas, 500 genérico só no handler central de app.ts).
// AppError junta as duas pontas: quem lança sabe o status e pode confiar
// que a mensagem vai aparecer pro cliente (nunca é stack trace nem detalhe
// interno) — o handler central em app.ts só olha `instanceof AppError` pra
// decidir se expõe a mensagem ou cai no 500 genérico.

export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
