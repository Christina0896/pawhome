import { requireAdmin } from '../../../../../lib/requireAdmin';
import { requireSameOrigin } from '../../../../../lib/requireSameOrigin';

export async function PATCH(request, { params }) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  const { supabaseAdmin } = admin;
  const { id: reportId } = await params;

  if (!reportId) {
    return Response.json({ error: 'Missing report ID.' }, { status: 400 });
  }

  try {
    const { status } = await request.json();

    if (status !== 'reviewed') {
      return Response.json({ error: 'Invalid report status.' }, { status: 400 });
    }

    const { data: updatedReport, error } = await supabaseAdmin
      .from('listing_reports')
      .update({ status: 'reviewed' })
      .eq('id', reportId)
      .select('id, status')
      .maybeSingle();

    if (error) {
      console.error('Admin report update error:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      return Response.json({ error: 'Could not update report.' }, { status: 500 });
    }

    if (!updatedReport) {
      return Response.json({ error: 'Report not found.' }, { status: 404 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin report PATCH route error:', {
      message: error?.message,
    });

    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  const { supabaseAdmin } = admin;
  const { id: reportId } = await params;

  if (!reportId) {
    return Response.json({ error: 'Missing report ID.' }, { status: 400 });
  }

  try {
    const { data: deletedReport, error } = await supabaseAdmin
      .from('listing_reports')
      .delete()
      .eq('id', reportId)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Admin report delete error:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      return Response.json({ error: 'Could not delete report.' }, { status: 500 });
    }

    if (!deletedReport) {
      return Response.json({ error: 'Report not found.' }, { status: 404 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin report DELETE route error:', {
      message: error?.message,
    });

    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
