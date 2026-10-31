"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/admin-layout";
import { StoreContent } from "@/types/admin";

export default function AdminContentPage() {
  const [content, setContent] = useState<StoreContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/content");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.content) {
            setContent(data.content);
          }
        }
      } catch {
        // Error
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: "success", text: data.message });
      } else {
        setStatusMessage({ type: "error", text: data.error || "Failed to update content." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Network error saving content." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !content) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-[#74786F] text-xs">
          Loading storefront CMS content...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DFD6] gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-luxury text-[#AA9160] font-semibold block">
              STOREFRONT EDITORIAL CMS
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#176B45]">
              Homepage & Brand Content
            </h1>
            <p className="text-xs text-[#74786F] mt-0.5">
              Manage promotional announcement bar, hero copy, artisanal brand story, and newsletter invitation.
            </p>
          </div>

          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 bg-[#FAF9F5] border border-[#E2DFD6] text-[#315039] hover:bg-[#EEEAE0] rounded-sm text-xs font-medium"
          >
            Preview Live Storefront ↗
          </Link>
        </div>

        {statusMessage && (
          <div
            className={`p-3 text-xs rounded-sm flex items-center justify-between ${
              statusMessage.type === "success"
                ? "bg-[#EAF5EF] border border-[#176B45]/20 text-[#176B45]"
                : "bg-[#FDF2F2] border border-[#991B1B]/20 text-[#991B1B]"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)}>✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Promotional Announcement Bar */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              Promotional Announcement Banner
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bannerActive"
                checked={content.promotionalBannerActive}
                onChange={(e) =>
                  setContent({ ...content, promotionalBannerActive: e.target.checked })
                }
                className="w-4 h-4 text-[#176B45] rounded"
              />
              <label htmlFor="bannerActive" className="text-xs text-[#252A25] font-medium">
                Display top header announcement banner
              </label>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Banner Announcement Text
              </label>
              <input
                type="text"
                value={content.promotionalBannerText}
                onChange={(e) =>
                  setContent({ ...content, promotionalBannerText: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
              />
            </div>
          </div>

          {/* 2. Hero Editorial Section */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              Homepage Hero Editorial Banner
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Hero Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={content.heroHeading}
                    onChange={(e) => setContent({ ...content, heroHeading: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Hero Subtitle / Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={content.heroDescription}
                    onChange={(e) => setContent({ ...content, heroDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                      Call to Action (CTA) Button Text
                    </label>
                    <input
                      type="text"
                      value={content.heroCtaText}
                      onChange={(e) => setContent({ ...content, heroCtaText: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                      Call to Action Target URL
                    </label>
                    <input
                      type="text"
                      value={content.heroCtaLink}
                      onChange={(e) => setContent({ ...content, heroCtaLink: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                    Hero Cover Imagery URL
                  </label>
                  <input
                    type="text"
                    value={content.heroImageUrl}
                    onChange={(e) => setContent({ ...content, heroImageUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
                  />
                </div>
              </div>

              {/* Cover Image Preview */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#EEEAE0]/70 border border-[#E2DFD6] rounded-sm">
                <span className="text-[10px] uppercase tracking-luxury text-[#74786F] mb-2">
                  Editorial Visual Preview
                </span>
                <div className="w-full aspect-[4/5] relative rounded-sm overflow-hidden bg-white border border-[#E2DFD6]">
                  <Image
                    src={content.heroImageUrl || "/images/banners/hero-editorial.jpg"}
                    alt="Hero Preview"
                    fill
                    className="object-cover"
                    sizes="250px"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Brand Story Editorial */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              Artisanal Brand Story Section
            </h3>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Story Heading
              </label>
              <input
                type="text"
                value={content.brandStoryHeading}
                onChange={(e) => setContent({ ...content, brandStoryHeading: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Story Body Text
              </label>
              <textarea
                rows={3}
                value={content.brandStoryBody}
                onChange={(e) => setContent({ ...content, brandStoryBody: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
              />
            </div>
          </div>

          {/* 4. Newsletter Invitation */}
          <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-base text-[#176B45] border-b border-[#E2DFD6] pb-2">
              Newsletter Subscription Invitation
            </h3>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Newsletter Heading
              </label>
              <input
                type="text"
                value={content.newsletterHeading}
                onChange={(e) => setContent({ ...content, newsletterHeading: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-luxury text-[#315039] font-medium mb-1">
                Newsletter Description
              </label>
              <input
                type="text"
                value={content.newsletterText}
                onChange={(e) => setContent({ ...content, newsletterText: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E2DFD6] rounded-sm text-xs text-[#252A25] focus:outline-none focus:border-[#176B45]"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-[#176B45] text-white rounded-sm text-xs uppercase tracking-luxury font-medium hover:bg-[#125837] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Publishing Changes..." : "Save & Update Storefront Content →"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

