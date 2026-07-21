import { requireAdmin } from '../../../../lib/requireAdmin';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const ADMIN_REPORT_SELECT = `
  id,
  listing_id,
  reason,
  details,
  status,
  created_at,
  listings (
    id,
    title,
    breed,
    animal_type,
    county,
    status,
    listing_photos (
      image_url,
      sort_order
    )
  )
`;

function getPositiveInt(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function formatReport(report) {
  const sortedPhotos = [...(report.listings?.listing_photos || [])].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
  );

  return {
    ...report,
    mainImage: sortedPhotos[0]?.image_url || null,
    photoCount: sortedPhotos.length,
  };
}

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  const { supabaseAdmin } = admin;
  const { searchParams } = new URL(request.url);
  const page = getPositiveInt(searchParams.get('page'), 1);
  const pageSize = getPositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabaseAdmin
    .from('listing_reports')
    .select(ADMIN_REPORT_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Admin reports API fetch error:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    return Response.json({ error: 'Could not load reports.' }, { status: 500 });
  }

  const totalCount = count || 0;

  return Response.json(
    {
      reports: (data || []).map(formatReport),
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(Math.ceil(totalCount / pageSize), 1),
    },
    { status: 200 },
  );
}
