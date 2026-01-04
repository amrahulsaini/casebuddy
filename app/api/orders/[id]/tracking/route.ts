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
    
    // Check for nested tracking_data structure first
    if (trackingData?.tracking_data) {
      const td = trackingData.tracking_data;
      
      // shipment_track_activities contains the actual tracking scans
      // shipment_track is just metadata, NOT activities
      if (td.shipment_track_activities && Array.isArray(td.shipment_track_activities)) {
        scans = td.shipment_track_activities;
      }
      
      trackUrl = td.track_url || null;
      etd = td.etd || null;
      
      // Get current status from shipment_track metadata
      if (td.shipment_track && Array.isArray(td.shipment_track) && td.shipment_track.length > 0) {
        currentStatus = td.shipment_track[0].current_status || null;
      }
    } else if (Array.isArray(trackingData) && trackingData.length > 0) {
      // Handle direct array response
      const shipmentData = trackingData[0];
      
      if (shipmentData.shipment_track_activities && Array.isArray(shipmentData.shipment_track_activities)) {
        scans = shipmentData.shipment_track_activities;
      }
      
      trackUrl = shipmentData.track_url || shipmentData.tracking_url || null;
      etd = shipmentData.edd || shipmentData.etd || null;
      currentStatus = shipmentData.current_status || null;
    }
    
    console.log('Extracted scans:', scans);
    console.log('Track URL:', trackUrl);
    console.log('ETD:', etd);
    console.log('Current Status:', currentStatus);

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
