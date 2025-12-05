import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  X, 
  Send, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

const AdminSupportTicketDetail = ({ ticket, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [replying, setReplying] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(ticket);

  useEffect(() => {
    if (ticket?.id) {
      fetchTicketDetails();
    }
  }, [ticket?.id]);

  const fetchTicketDetails = async () => {
    if (!ticket?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTicketDetails(data);
      } else {
        setError('Failed to fetch ticket details');
      }
    } catch (err) {
      setError('Error loading ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) return;

    setReplying(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/support/tickets/${ticket.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: replyMessage.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Reply sent successfully');
        setReplyMessage('');
        setTicketDetails(data.ticket);
        onUpdate();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send reply');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setReplying(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/support/tickets/${ticket.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          notes: resolveNotes || 'Ticket resolved by admin'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Ticket resolved successfully');
        setTicketDetails(data.ticket);
        setShowResolveForm(false);
        setResolveNotes('');
        onUpdate();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to resolve ticket');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setResolving(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close this ticket? This action cannot be undone.')) {
      return;
    }

    setClosing(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/support/tickets/${ticket.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'closed',
          notes: 'Ticket closed by admin'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Ticket closed successfully');
        setTicketDetails(data.ticket);
        onUpdate();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to close ticket');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setClosing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-600';
      case 'in_progress':
        return 'bg-yellow-600';
      case 'resolved':
        return 'bg-green-600';
      case 'closed':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-600';
      case 'medium':
        return 'bg-blue-600';
      case 'high':
        return 'bg-orange-600';
      case 'urgent':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Parse message content to separate original message and replies
  const parseMessages = (messageContent) => {
    if (!messageContent) return [];
    
    const messages = [];
    const parts = messageContent.split(/\n\n--- (.*?) ---\n/);
    
    // First part is the original message
    if (parts[0].trim()) {
      messages.push({
        id: 'original',
        from: 'user',
        message: parts[0].trim(),
        timestamp: ticketDetails.created_at,
        author: ticketDetails.user_info?.full_name || 'User'
      });
    }
    
    // Process subsequent parts (replies and admin updates)
    for (let i = 1; i < parts.length; i += 2) {
      const header = parts[i];
      const content = parts[i + 1];
      
      if (header && content) {
        const isAdminReply = header.includes('Admin Reply by');
        const isAdminUpdate = header.includes('Admin Update by') || header.includes('RESOLVED by');
        const isUserReply = header.includes('User Reply');
        
        messages.push({
          id: `msg-${i}`,
          from: isAdminReply || isAdminUpdate ? 'admin' : 'user',
          message: content.trim(),
          timestamp: new Date().toISOString(), // We could parse timestamp from header if needed
          author: isAdminReply || isAdminUpdate ? 'Admin' : ticketDetails.user_info?.full_name || 'User',
          isUpdate: isAdminUpdate
        });
      }
    }
    
    return messages;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading ticket details...</p>
        </div>
      </div>
    );
  }

  const messages = parseMessages(ticketDetails.message);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-bold">
                Ticket #{ticketDetails.ticket_id || ticketDetails.id} - {ticketDetails.subject}
              </h2>
              <p className="text-sm text-gray-600">
                Created {new Date(ticketDetails.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(ticketDetails.status)}>
              {getStatusIcon(ticketDetails.status)}
              <span className="ml-1 capitalize">{ticketDetails.status.replace('_', ' ')}</span>
            </Badge>
            <Badge className={getPriorityColor(ticketDetails.priority)}>
              {ticketDetails.priority}
            </Badge>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-semibold">{ticketDetails.user_info?.full_name}</p>
                <p className="text-sm text-gray-600">{ticketDetails.user_info?.grant_number}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm">{ticketDetails.user_info?.email}</p>
                <p className="text-sm text-gray-600">Account: {ticketDetails.user_info?.account_number}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.from === 'admin' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.from === 'admin'
                      ? message.isUpdate 
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">
                      {message.author}
                    </span>
                    <span className="text-xs opacity-75">
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  {message.isUpdate && (
                    <div className="mt-2 text-xs opacity-75">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Status Update
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Area */}
        <div className="p-6 border-t bg-gray-50">
          {/* Reply Form */}
          {ticketDetails.status !== 'closed' && ticketDetails.status !== 'resolved' && (
            <div className="mb-4">
              <Label htmlFor="reply" className="text-sm font-medium">Reply to Customer</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="reply"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                />
                <Button
                  onClick={handleReply}
                  disabled={!replyMessage.trim() || replying}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {replying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Resolve Form */}
          {showResolveForm && ticketDetails.status !== 'closed' && ticketDetails.status !== 'resolved' && (
            <div className="mb-4 p-4 border rounded-lg bg-white">
              <Label htmlFor="resolveNotes" className="text-sm font-medium">Resolution Notes</Label>
              <textarea
                id="resolveNotes"
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Enter resolution notes (optional)..."
                className="w-full mt-2 p-2 border rounded-md h-20 resize-none"
              />
              <div className="flex space-x-2 mt-3">
                <Button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {resolving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resolving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Resolve
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowResolveForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {ticketDetails.status !== 'closed' && ticketDetails.status !== 'resolved' && (
                <>
                  <Button
                    onClick={() => setShowResolveForm(!showResolveForm)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </Button>
                  <Button
                    onClick={handleClose}
                    disabled={closing}
                    variant="destructive"
                  >
                    {closing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Closing...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Close Ticket
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              Last updated: {new Date(ticketDetails.last_reply || ticketDetails.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSupportTicketDetail;
