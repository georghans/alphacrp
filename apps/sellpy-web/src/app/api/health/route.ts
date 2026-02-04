export function GET() {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "alphacrp-web",
  });
}
