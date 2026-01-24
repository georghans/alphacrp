import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const required = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
};

export type BucketConfig = {
  endpoint: string;
  region: string;
  name: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string;
  forcePathStyle?: boolean;
};

export function getBucketConfig(): BucketConfig {
  const endpoint = required(process.env.BUCKET_ENDPOINT, "BUCKET_ENDPOINT");
  const region = required(process.env.BUCKET_REGION, "BUCKET_REGION");
  const name = required(process.env.BUCKET_NAME, "BUCKET_NAME");
  const accessKeyId = required(process.env.BUCKET_KEY, "BUCKET_KEY");
  const secretAccessKey = required(process.env.BUCKET_SECRET, "BUCKET_SECRET");
  const publicBaseUrl = process.env.BUCKET_PUBLIC_BASE_URL;
  const forcePathStyle = process.env.BUCKET_FORCE_PATH_STYLE === "true";

  return { endpoint, region, name, accessKeyId, secretAccessKey, publicBaseUrl, forcePathStyle };
}

export function createBucketClient(config: BucketConfig) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    },
    forcePathStyle: Boolean(config.forcePathStyle)
  });
}

export function buildPublicUrl(config: BucketConfig, key: string) {
  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  const endpoint = new URL(config.endpoint);
  return `${endpoint.protocol}//${config.name}.${endpoint.host}/${key}`;
}

export async function uploadReferenceImage(params: {
  file: File;
  keyPrefix: string;
  searchId?: string;
}) {
  const config = getBucketConfig();
  const client = createBucketClient(config);
  const buffer = Buffer.from(await params.file.arrayBuffer());
  const extension = params.file.name.includes(".")
    ? params.file.name.split(".").pop()
    : "bin";
  const safeExtension = extension ? extension.toLowerCase() : "bin";
  const id = crypto.randomUUID();
  const searchSegment = params.searchId ? params.searchId : "unassigned";
  const key = `${params.keyPrefix}/${searchSegment}/${id}.${safeExtension}`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.name,
      Key: key,
      Body: buffer,
      ContentType: params.file.type || "application/octet-stream",
      ACL: "public-read"
    })
  );

  return buildPublicUrl(config, key);
}
