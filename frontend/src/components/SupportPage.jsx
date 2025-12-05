import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Phone, Mail, MapPin, Plus, Clock, CheckCircle, XCircle, AlertCircle, Send } from 'lucide-react';
import Layout from './Layout';
import { supabase } from '../utils/supabase';

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState('contact');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [user, setUser] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  
  // New ticket form state
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general'
  });

  useEffect(() => {
    fetchUserData();
    fetchUserTickets();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return;

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError) {
        setUser(profile);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const fetchUserTickets = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
      } else {
        setTickets(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      setMessage('Please fill in all required fields.');
      setMessageType('error');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setMessage('Please log in to submit a ticket.');
        setMessageType('error');
        return;
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          category: formData.category,
          status: 'open',
          priority: 'medium'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        setMessage('Failed to create support ticket. Please try again.');
        setMessageType('error');
      } else {
        setMessage(`Support ticket #${data.ticket_id} created successfully! We'll get back to you soon.`);
        setMessageType('success');
        setFormData({ subject: '', message: '', category: 'general' });
        fetchUserTickets();
        setActiveTab('tickets');
      }
    } catch (err) {
      console.error('Error:', err);
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
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

  const openTicketDetail = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetail(true);
  };

  const closeTicketDetail = () => {
    setSelectedTicket(null);
    setShowTicketDetail(false);
  };

  // Parse conversation messages from the message field
  const parseConversation = (messageText) => {
    if (!messageText) return [];
    
    const messages = [];
    const parts = messageText.split(/\n\n--- (.*?) ---\n/);
    
    // First part is the original message
    if (parts[0].trim()) {
      messages.push({
        id: 'original',
        from: 'user',
        content: parts[0].trim(),
        timestamp: selectedTicket?.created_at,
        author: user?.first_name ? `${user.first_name} ${user.last_name}` : 'You'
      });
    }
    
    // Process admin replies and updates
    for (let i = 1; i < parts.length; i += 2) {
      const header = parts[i];
      const content = parts[i + 1];
      
      if (header && content) {
        const isAdmin = header.includes('Admin') || header.includes('RESOLVED');
        const isUpdate = header.includes('RESOLVED') || header.includes('Status');
        
        messages.push({
          id: `msg-${i}`,
          from: isAdmin ? 'admin' : 'user',
          content: content.trim(),
          timestamp: new Date().toISOString(), // Could parse from header if available
          author: isAdmin ? 'UNSEAF Support' : (user?.first_name ? `${user.first_name} ${user.last_name}` : 'You'),
          isUpdate: isUpdate
        });
      }
    }
    
    return messages;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Center</h1>
          <p className="text-gray-600">Get help when you need it</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <Button
            onClick={() => setActiveTab('contact')}
            variant={activeTab === 'contact' ? 'default' : 'outline'}
          >
            Contact Info
          </Button>
          <Button
            onClick={() => setActiveTab('create')}
            variant={activeTab === 'create' ? 'default' : 'outline'}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
          <Button
            onClick={() => setActiveTab('tickets')}
            variant={activeTab === 'tickets' ? 'default' : 'outline'}
            className="relative"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            My Tickets
            {tickets.length > 0 && (
              <Badge className="ml-2 bg-blue-600 text-white">
                {tickets.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Contact Information Tab */}
        {activeTab === 'contact' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-900">Email Support</h3>
                <p className="text-sm text-blue-700">info@unseaf.org</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-900">Phone Support</h3>
                <p className="text-sm text-green-700">+31 97010209755</p>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-purple-900">Live Chat</h3>
                <p className="text-sm text-purple-700">24/7 Available</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4 text-center">
                <MapPin className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <h3 className="font-semibold text-orange-900">Office Address</h3>
                <p className="text-sm text-orange-700">Chemin Camille‑Vidart 12</p>
                <p className="text-sm text-orange-700">1209 Geneva, Switzerland</p>
                <p className="text-sm text-orange-700">(Petit‑Saconnex)</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Ticket Tab */}
        {activeTab === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
              <p className="text-gray-600">Describe your issue and we'll help you resolve it.</p>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert className={`mb-4 ${
                  messageType === 'success' 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  <AlertDescription className={
                    messageType === 'success' ? 'text-green-800' : 'text-red-800'
                  }>
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="account">Account Issues</option>
                    <option value="kyc">KYC/Verification</option>
                    <option value="transaction">Transaction Issues</option>
                    <option value="technical">Technical Support</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of your issue"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Please provide detailed information about your issue..."
                    required
                    rows={6}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Ticket...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create Ticket
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* My Tickets Tab */}
        {activeTab === 'tickets' && (
          <Card>
            <CardHeader>
              <CardTitle>My Support Tickets</CardTitle>
              <p className="text-gray-600">Track the status of your support requests</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your tickets...</p>
                </div>
              ) : tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                         onClick={() => openTicketDetail(ticket)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg">#{ticket.ticket_id}</h3>
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                            </Badge>
                            <Badge variant="outline">
                              {ticket.category}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">{ticket.subject}</h4>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {ticket.message.length > 150 
                              ? ticket.message.substring(0, 150) + '...' 
                              : ticket.message
                            }
                          </p>
                          <div className="text-xs text-gray-500">
                            Created: {new Date(ticket.created_at).toLocaleDateString()}
                            {ticket.last_reply && ticket.last_reply !== ticket.created_at && (
                              <span className="ml-4">
                                Last reply: {new Date(ticket.last_reply).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openTicketDetail(ticket);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Support Tickets</h3>
                  <p className="text-gray-600 mb-4">
                    You haven't created any support tickets yet.
                  </p>
                  <Button
                    onClick={() => setActiveTab('create')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Ticket
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ticket Detail Modal */}
        {showTicketDetail && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl h-[80vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-3">
                  <div>
                    <h2 className="text-xl font-bold">
                      Ticket #{selectedTicket.ticket_id} - {selectedTicket.subject}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Created {new Date(selectedTicket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {getStatusIcon(selectedTicket.status)}
                    <span className="ml-1 capitalize">{selectedTicket.status.replace('_', ' ')}</span>
                  </Badge>
                  <Badge variant="outline">
                    {selectedTicket.category}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={closeTicketDetail}>
                    ✕
                  </Button>
                </div>
              </div>

              {/* Conversation Area */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {parseConversation(selectedTicket.message).map((message) => (
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
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                
                {/* Empty state if no conversation */}
                {parseConversation(selectedTicket.message).length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No messages in this conversation yet.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {selectedTicket.status === 'open' && (
                      <span className="text-blue-600 font-medium">
                        ⏳ Your ticket is open and waiting for a response
                      </span>
                    )}
                    {selectedTicket.status === 'in_progress' && (
                      <span className="text-yellow-600 font-medium">
                        🔄 Your ticket is being worked on by our support team
                      </span>
                    )}
                    {selectedTicket.status === 'resolved' && (
                      <span className="text-green-600 font-medium">
                        ✅ Your ticket has been resolved
                      </span>
                    )}
                    {selectedTicket.status === 'closed' && (
                      <span className="text-gray-600 font-medium">
                        🔒 This ticket has been closed
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Last updated: {new Date(selectedTicket.last_reply || selectedTicket.created_at).toLocaleString()}
                  </div>
                </div>
                
                {selectedTicket.status === 'resolved' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      This ticket has been marked as resolved. If you need further assistance, please create a new ticket.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupportPage;
