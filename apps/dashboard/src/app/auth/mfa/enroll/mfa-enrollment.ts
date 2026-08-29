type EnrollmentResult = Readonly<{
  factorId: string;
  qrCode: string;
  secret: string;
}>;

type MfaPort = Readonly<{
  enroll: (input: { factorType: "totp"; friendlyName: string }) => Promise<{
    data: { id: string; totp: { qr_code: string; secret: string } } | null;
    error: unknown;
  }>;
  listFactors: () => Promise<{
    data: {
      all: ReadonlyArray<{
        factor_type: string;
        id: string;
        status: string;
      }>;
    } | null;
    error: unknown;
  }>;
  unenroll: (input: { factorId: string }) => Promise<{ error: unknown }>;
}>;

export async function prepareMfaEnrollment(
  mfa: MfaPort,
): Promise<EnrollmentResult> {
  const listed = await mfa.listFactors();
  if (listed.error || !listed.data) throw new Error("MFA_FACTORS_UNAVAILABLE");

  const abandoned = listed.data.all.filter(
    (factor) => factor.factor_type === "totp" && factor.status === "unverified",
  );

  for (const factor of abandoned) {
    const removed = await mfa.unenroll({ factorId: factor.id });
    if (removed.error) throw new Error("MFA_FACTOR_CLEANUP_FAILED");
  }

  const result = await mfa.enroll({
    factorType: "totp",
    friendlyName: "Devora OS",
  });
  if (result.error || !result.data) throw new Error("MFA_ENROLLMENT_FAILED");

  return {
    factorId: result.data.id,
    qrCode: result.data.totp.qr_code,
    secret: result.data.totp.secret,
  };
}
