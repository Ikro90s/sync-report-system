export async function startDlqWorker(requestId: string) {
    console.error(`[CRITICAL ALERT] Pedido ${requestId} falhou e precisa de verificação manual.`);
}
