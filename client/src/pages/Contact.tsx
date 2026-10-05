import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { createEnquiry } from '../api/enquiries';
import { useSettings } from '../context/SettingsContext';
import { getWhatsAppUrl } from '../utils/whatsapp';

const enquirySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

export default function Contact(): React.ReactElement {
  const { settings } = useSettings();
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      subject: 'Tour Package Enquiry',
      message: '',
    },
  });

  const onSubmit = async (data: EnquiryFormData): Promise<void> => {
    setSubmitting(true);
    setServerError('');
    try {
      const res = await createEnquiry(data as any);
      if (res.success) {
        setSubmitted(true);
        reset();
      }
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to submit enquiry. Please try again or WhatsApp us.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappDirect = getWhatsAppUrl(
    settings.whatsappNumber,
    '🌿 Hello Hills Angel Tours! I have a travel enquiry.'
  );

  return (
    <>
      <Helmet>
        <title>Contact Us | Hills Angel Tours and Travels</title>
        <meta
          name="description"
          content="Get in touch with Hills Angel Tours and Travels. Call, message on WhatsApp, or send an enquiry for customized hill station holidays."
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            We're Here For You
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-text">
            Connect with Our Travel Specialists
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Have questions about customized dates, vehicle pickup points, or family groups? Send us a message or chat directly.
          </p>
        </div>

        {/* Quick Contact Buttons (Mobile-first) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          <a
            href={whatsappDirect}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[50px] flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] text-white font-semibold text-sm shadow-md hover:bg-[#20ba5a] active:scale-95 transition-all p-3"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Chat Directly on WhatsApp</span>
          </a>

          <a
            href={`tel:${settings.contactPhone?.replace(/\s+/g, '')}`}
            className="min-h-[50px] flex items-center justify-center gap-2.5 rounded-2xl bg-primary text-white font-semibold text-sm shadow-elaichi hover:bg-primary-dark active:scale-95 transition-all p-3"
          >
            <Phone className="w-5 h-5" />
            <span>Call: {settings.contactPhone}</span>
          </a>
        </div>

        {/* Form & Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Enquiry Form */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-elaichi">
            <h3 className="font-serif text-xl font-bold text-text mb-6">
              Send an Enquiry
            </h3>

            {submitted ? (
              <div className="p-8 text-center space-y-3 bg-primary-light/40 rounded-2xl border border-primary/30">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
                <h4 className="font-bold text-primary-dark text-base">Enquiry Received!</h4>
                <p className="text-xs text-muted">
                  Thank you for reaching out. One of our destination specialists will call or message you on WhatsApp shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-3 text-xs text-primary font-semibold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                    {serverError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-text mb-1" htmlFor="name">
                    Your Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g. Meera Krishnan"
                    {...register('name')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  />
                  {errors.name && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1" htmlFor="contactPhone">
                      Phone Number <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit number"
                      {...register('phone')}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                    />
                    {errors.phone && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text mb-1" htmlFor="contactEmail">
                      Email Address <span className="text-muted font-normal">(Optional)</span>
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      placeholder="name@example.com"
                      {...register('email')}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                    />
                    {errors.email && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1" htmlFor="subject">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    {...register('subject')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  />
                  {errors.subject && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.subject.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1" htmlFor="message">
                    How can we help? <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder="Tell us about your dates, preferred hill station, group size, or questions..."
                    {...register('message')}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  {errors.message && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[48px] py-3 rounded-xl bg-gradient-elaichi text-white font-semibold text-sm shadow-elaichi active:scale-95 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Tour Enquiry</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact Information & Map Embed Placeholder */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="font-serif text-xl font-bold text-text">
                Office & Coordinator Desks
              </h3>

              <div className="space-y-4 text-xs sm:text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-text block">Headquarters:</span>
                    <span>{settings.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-text block">Phone / WhatsApp:</span>
                    <span>{settings.contactPhone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-text block">Email Support:</span>
                    <span>{settings.contactEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map Embed */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm aspect-[16/9] relative">
              <iframe
                title="Hills Angel Tours Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62551.48869151528!2d76.66699327827253!3d11.411854497673554!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba8bd84b5f3d78d%3A0x179bdb14c93e3f42!2sOoty%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
