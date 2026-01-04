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
      
      console.log('Shiprocket tracking response:', JSON.stringify(trackingData, null, 2));
    } catch (error) {
      console.error('Shiprocket tracking API error:', error);
      return NextResponse.json({ scans: [] });
    }

    // Extract scans from tracking data - try multiple possible paths
    let scans = [];
    let trackUrl = null;
    let etd = null;
    let currentStatus = null;
    
    // Check if response is an array (direct shipment data)
    if (Array.isArray(trackingData) && trackingData.length > 0) {
      const shipmentData = trackingData[0];
      
      // Try to find scans/activities in various fields
      if (shipmentData.shipment_track_activities) {
        scans = shipmentData.shipment_track_activities;
      } else if (shipmentData.scans) {
        scans = shipmentData.scans;
      } else if (shipmentData.qc_response?.shipment_track_activities) {
        scans = shipmentData.qc_response.shipment_track_activities;
      }
      
      trackUrl = shipmentData.track_url || shipmentData.tracking_url || null;
      etd = shipmentData.edd || shipmentData.etd || null;
      currentStatus = shipmentData.current_status || null;
    } else {
      // Try nested structure
      if (trackingData?.tracking_data?.shipment_track_activities) {
        scans = trackingData.tracking_data.shipment_track_activities;
      } else if (trackingData?.shipment_track_activities) {
        scans = trackingData.shipment_track_activities;
      } else if (trackingData?.tracking_data?.shipment_track) {
        scans = trackingData.tracking_data.shipment_track;
      } else if (trackingData?.shipment_track) {
        scans = trackingData.shipment_track;
      }
      
      trackUrl = trackingData?.tracking_data?.track_url || trackingData?.tracking_url || trackingData?.track_url || null;
      etd = trackingData?.tracking_data?.etd || trackingData?.etd || trackingData?.edd || null;
      currentStatus = trackingData?.tracking_data?.shipment_track?.[0]?.current_status || trackingData?.current_status || null;
    }
    
    console.log('Extracted scans:', scans);
    console.log('Track URL:', trackUrl);
    console.log('ETD:', etd);

    // Format scans for frontend
    const formattedScans = Array.isArray(scans) ? scans.map((scan: any) => {
      const dateTime = scan.date || scan.timestamp || '';
      const [datePart, timePart] = dateTime.split(' ');
      
      return {
        activity: scan.activity || scan.status || '',
        location: scan.location || '',
        date: datePart || '',
        time: timePart || '',
        timestamp: dateTime,
      };
    }) : [];

    return NextResponse.json({
      scans: formattedScans,
      tracking_url: trackUrl,
      etd: etd,
      current_status: currentStatus,
    });
  } catch (error) {
    console.error('Error fetching tracking details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking details', scans: [] },
      { status: 500 }
    );
  }
}
