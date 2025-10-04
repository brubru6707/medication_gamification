export async function parseOcrMock(file?: File | null): Promise<{name?: string; dosage?: string}> {
  await new Promise(r => setTimeout(r, 250));
  return { name: "Lisinopril", dosage: "10mg" };
}