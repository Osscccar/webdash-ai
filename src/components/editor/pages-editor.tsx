"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2 } from "lucide-react";

// This is a mock implementation as we don't have access to the actual API yet
// In a real implementation, this would be fetched from the API based on the sitemap generation
const initialPages = [
  {
    id: "home",
    title: "Home",
    description: "Welcome to our website.",
    sections: [
      {
        id: "hero",
        title: "Hero Section",
        description: "A compelling introduction to your business.",
      },
      {
        id: "services",
        title: "Services Overview",
        description: "Highlight your main services or products.",
      },
      {
        id: "about-preview",
        title: "About Us Preview",
        description: "Brief introduction to your company.",
      },
    ],
  },
  {
    id: "about",
    title: "About Us",
    description: "Learn more about our company and mission.",
    sections: [
      {
        id: "mission",
        title: "Our Mission",
        description: "What drives us and our purpose.",
      },
      {
        id: "team",
        title: "Our Team",
        description: "Meet the people behind our company.",
      },
      {
        id: "values",
        title: "Our Values",
        description: "The principles that guide our work.",
      },
    ],
  },
  {
    id: "services",
    title: "Services",
    description: "Explore our range of services.",
    sections: [
      {
        id: "service-1",
        title: "Service 1",
        description: "Detailed description of your first service.",
      },
      {
        id: "service-2",
        title: "Service 2",
        description: "Detailed description of your second service.",
      },
      {
        id: "service-3",
        title: "Service 3",
        description: "Detailed description of your third service.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    description: "Get in touch with our team.",
    sections: [
      {
        id: "contact-form",
        title: "Contact Form",
        description: "A form for visitors to send you messages.",
      },
      {
        id: "contact-info",
        title: "Contact Information",
        description: "Your business address, phone, and email.",
      },
      {
        id: "map",
        title: "Map",
        description: "A map showing your business location.",
      },
    ],
  },
];

interface Page {
  id: string;
  title: string;
  description: string;
  sections: Section[];
}

interface Section {
  id: string;
  title: string;
  description: string;
}

export function PagesEditor() {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [editingSection, setEditingSection] = useState<{
    pageId: string;
    section: Section;
  } | null>(null);

  const handleEditPage = (page: Page) => {
    setEditingPage({ ...page });
  };

  const handleSavePage = () => {
    if (!editingPage) return;

    const newPages = pages.map((page) =>
      page.id === editingPage.id ? editingPage : page
    );
    setPages(newPages);
    setEditingPage(null);
  };

  const handleEditSection = (pageId: string, section: Section) => {
    setEditingSection({ pageId, section: { ...section } });
  };

  const handleSaveSection = () => {
    if (!editingSection) return;

    const { pageId, section } = editingSection;
    const pageIndex = pages.findIndex((p) => p.id === pageId);

    if (pageIndex !== -1) {
      const newPages = [...pages];
      const sectionIndex = newPages[pageIndex].sections.findIndex(
        (s) => s.id === section.id
      );

      if (sectionIndex !== -1) {
        newPages[pageIndex].sections[sectionIndex] = section;
        setPages(newPages);
      }
    }

    setEditingSection(null);
  };

  const handleMovePageUp = (index: number) => {
    if (index === 0) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[index - 1];
    newPages[index - 1] = temp;
    setPages(newPages);
  };

  const handleMovePageDown = (index: number) => {
    if (index === pages.length - 1) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[index + 1];
    newPages[index + 1] = temp;
    setPages(newPages);
  };

  const handleMoveSectionUp = (pageId: string, sectionIndex: number) => {
    if (sectionIndex === 0) return;
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const newPages = [...pages];
    const sections = [...newPages[pageIndex].sections];
    const temp = sections[sectionIndex];
    sections[sectionIndex] = sections[sectionIndex - 1];
    sections[sectionIndex - 1] = temp;
    newPages[pageIndex].sections = sections;
    setPages(newPages);
  };

  const handleMoveSectionDown = (pageId: string, sectionIndex: number) => {
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const sections = pages[pageIndex].sections;
    if (sectionIndex === sections.length - 1) return;

    const newPages = [...pages];
    const newSections = [...newPages[pageIndex].sections];
    const temp = newSections[sectionIndex];
    newSections[sectionIndex] = newSections[sectionIndex + 1];
    newSections[sectionIndex + 1] = temp;
    newPages[pageIndex].sections = newSections;
    setPages(newPages);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Website Pages</h2>
        <Button
          size="sm"
          className="bg-[#f58327] hover:bg-[#f58327]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Page
        </Button>
      </div>

      {editingPage ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Page</CardTitle>
            <CardDescription>
              Modify the page title and description.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="page-title"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Page Title
                </label>
                <Input
                  id="page-title"
                  value={editingPage.title}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, title: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label
                  htmlFor="page-description"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Page Description
                </label>
                <Textarea
                  id="page-description"
                  value={editingPage.description}
                  onChange={(e) =>
                    setEditingPage({
                      ...editingPage,
                      description: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setEditingPage(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#f58327] hover:bg-[#f58327]/90 text-white"
              onClick={handleSavePage}
            >
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      ) : editingSection ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Section</CardTitle>
            <CardDescription>
              Modify the section title and description.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="section-title"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Section Title
                </label>
                <Input
                  id="section-title"
                  value={editingSection.section.title}
                  onChange={(e) =>
                    setEditingSection({
                      ...editingSection,
                      section: {
                        ...editingSection.section,
                        title: e.target.value,
                      },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label
                  htmlFor="section-description"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Section Description
                </label>
                <Textarea
                  id="section-description"
                  value={editingSection.section.description}
                  onChange={(e) =>
                    setEditingSection({
                      ...editingSection,
                      section: {
                        ...editingSection.section,
                        description: e.target.value,
                      },
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setEditingSection(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#f58327] hover:bg-[#f58327]/90 text-white"
              onClick={handleSaveSection}
            >
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-4">
          {pages.map((page, index) => (
            <Card key={page.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <div className="flex-grow">
                    <CardTitle>{page.title}</CardTitle>
                    <CardDescription>{page.description}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    {index > 0 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMovePageUp(index)}
                        title="Move Up"
                      >
                        ↑
                      </Button>
                    )}
                    {index < pages.length - 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMovePageDown(index)}
                        title="Move Down"
                      >
                        ↓
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditPage(page)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="text-sm font-normal mb-2">Page Sections</h4>
                <div className="space-y-2">
                  {page.sections.map((section, sectionIndex) => (
                    <div
                      key={section.id}
                      className="flex items-center p-2 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center mr-2">
                        {sectionIndex > 0 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() =>
                              handleMoveSectionUp(page.id, sectionIndex)
                            }
                            title="Move Up"
                          >
                            ↑
                          </Button>
                        )}
                        {sectionIndex < page.sections.length - 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() =>
                              handleMoveSectionDown(page.id, sectionIndex)
                            }
                            title="Move Down"
                          >
                            ↓
                          </Button>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="font-normal text-sm">
                          {section.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {section.description}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEditSection(page.id, section)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="mt-4 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Section
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button className="bg-[#f58327] hover:bg-[#f58327]/90 text-white">
        Save Page Structure
      </Button>
    </div>
  );
}
