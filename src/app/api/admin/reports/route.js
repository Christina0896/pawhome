import { requireAdmin } from '../../../../lib/requireAdmin';

export const dynamic = 'force-dynamic';

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

function formatReport(report) {
  const sortedPhotos = [...(report.listings?.listing_photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return {
    ...report,
    mainImage: sortedPhotos[0]?.image_url || null,
    photoCount: sortedPhotos.length,
  };
}

export async function GET(request) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  const { supabaseAdmin } = admin;

  const { data, error } = await supabaseAdmin
    .from('listing_reports')
    .select(ADMIN_REPORT_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin reports API fetch error:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    return Response.json({ error: 'Could not load reports.' }, { status: 500 });
  }

  return Response.json({ reports: (data || []).map(formatReport) }, { status: 200 });
}
