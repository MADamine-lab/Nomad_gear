import React, { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './ui/dialog'
import { useOrders } from '../hooks/useApi'

interface OrderHistoryProps {
  open: boolean
  onClose: () => void
}

export function OrderHistory({ open, onClose }: OrderHistoryProps) {
  const { orders, fetchOrders, loading, error } = useOrders()

  useEffect(() => {
    if (open) {
      // load the current user's orders when the modal opens
      fetchOrders().then(() => {
        console.log('OrderHistory fetched orders', orders);
      });
    }
  }, [open, fetchOrders]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Your Rental History</DialogTitle>
        </DialogHeader>

        {loading && <div className="py-4 text-center">Loading...</div>}

        {error && (
          <div className="py-4 text-center text-red-600">{error}</div>
        )}

        {!loading && orders.length === 0 && (
          <div className="py-4 text-center">You haven't rented anything yet.</div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {orders.map((o: any) => (
              <div
                key={o.id}
                className="border rounded-lg p-3 bg-white shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">#{o.order_number}</span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full` +
                      (o.status === 'completed'
                        ? ' bg-green-100 text-green-800'
                        : o.status === 'cancelled'
                        ? ' bg-red-100 text-red-800'
                        : o.status === 'in_progress'
                        ? ' bg-yellow-100 text-yellow-800'
                        : ' bg-gray-100 text-gray-800')}
                  >
                    {o.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  {o.gear_name} &times; {o.quantity}
                </div>
                <div className="text-sm text-gray-600">
                  {o.start_date} → {o.end_date}
                </div>
                <div className="text-sm font-semibold text-gray-800 mt-1">
                  {o.final_price} {o.currency}
                </div>

                {/* timeline events from database */}
                {o.timeline && o.timeline.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    {o.timeline.map((ev: any) => (
                      <div key={ev.id} className="flex justify-between">
                        <span>{new Date(ev.created_at).toLocaleDateString()}</span>
                        <span>{ev.event_type.replace('_', ' ')}</span>
                        <span className="italic">{ev.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogClose className="mt-4 inline-flex items-center px-4 py-2 bg-sage-500 text-white rounded hover:bg-sage-600">
          Close
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

export default OrderHistory
