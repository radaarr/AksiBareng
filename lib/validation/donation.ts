import { z } from 'zod'

/** Label wajib di semua permukaan nominal donasi (docs/UI_UX.md §5).
 * Satu-satunya sumber teks ini; lapisan lain mengimpor dari sini. */
export const SIMULATION_LABEL = 'SIMULASI — aset testnet Sepolia, bukan uang sungguhan'

/** 0,001 ETH testnet — batas minimum yang juga dipakai kontrak. */
export const MIN_AMOUNT_WEI = 1_000_000_000_000_000n
export const MIN_AMOUNT_WEI_DECIMAL = MIN_AMOUNT_WEI.toString()

export const donationIntentSchema = z
  .object({
    amountWei: z
      .string()
      .trim()
      .regex(/^\d+$/, 'Nominal harus berupa angka bulat dalam wei.')
      .transform((value) => BigInt(value))
      .refine((value) => value >= MIN_AMOUNT_WEI, {
        message: 'Nominal minimal 0.001 ETH testnet.'
      })
      .transform((value) => value.toString()),
    displayName: z
      .string()
      .trim()
      .max(40, 'Nama tampilan maksimal 40 karakter.')
      .optional(),
    isAnonymous: z.boolean().optional()
  })
  .strict()

export type DonationIntentInput = z.infer<typeof donationIntentSchema>

/** Pesan pertama yang bisa ditampilkan ke pengguna dari error validasi. */
export function donationIntentErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? 'Data donasi tidak valid.'
  }
  if (error instanceof Error) return error.message
  return 'Data donasi tidak valid.'
}
