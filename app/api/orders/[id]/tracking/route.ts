import { NextRequest, NextResponse } from 'next/server';
import { shiprocketRequest } from '@/lib/shiprocket';
import caseMainPool from '@/lib/db-main';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // Get the shipment AWB/shipment_id from database
    const [shipments]: any = await caseMainPool.execute(
      `SELECT shiprocket_shipment_id, shiprocket_awb FROM shipments WHERE order_id = ?`,
      [orderId]
    );

    if (!shipments || shipments.length === 0) {
      return NextResponse.json({ scans: [] });
    }

    const shipment = shipments[0];
    const shipmentId = shipment.shiprocket_shipment_id;
    const awb = shipment.shiprocket_awb;

    if (!shipmentId && !awb) {
      return NextResponse.json({ scans: [] });
    }

    // Fetch tracking details from Shiprocket using AWB (required)
    if (!awb) {
      return NextResponse.json({ scans: [] });
    }

    let trackingData: any;
    
    try {
      // Use external API endpoint which doesn't require special permissions
      trackingData = await shiprocketRequest(`/v1/external/courier/track/awb/${encodeURIComponent(String(awb))}`, {
        method: 'GET',
      });
    } catch (error) {
      console.error('Shiprocket tracking API error:', error);
      return NextResponse.json({ scans: [] });
    }

    // Extract scans from tracking data
    const scans = trackingData?.tracking_data?.shipment_track_activities || [];

    // Format scans for frontend
    const formattedScans = scans.map((scan: any) => {
      const dateTime = scan.date || '';
      const [datePart, timePart] = dateTime.split(' ');
      
      return {
        activity: scan.activity || '',
        location: scan.location || '',
        date: datePart || '',
        time: timePart || '',
        timestamp: dateTime,
      };
    });

    return NextResponse.json({
      scans: formattedScans,
      tracking_url: trackingData?.tracking_data?.track_url || trackingData?.tracking_url || null,
      etd: trackingData?.tracking_data?.etd || trackingData?.etd || null,
      current_status: trackingData?.tracking_data?.shipment_track?.[0]?.current_status || trackingData?.current_status || null,
    });
  } catch (error) {
    console.error('Error fetching tracking details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking details', scans: [] },
      { status: 500 }
    );
  }
}
