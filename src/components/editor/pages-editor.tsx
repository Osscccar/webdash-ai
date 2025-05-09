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
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Plus, GripVertical, Edit2, Trash2 } from "lucide-react";

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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (result.type === "page") {
      const reorderedPages = [...pages];
      const [removed] = reorderedPages.splice(sourceIndex, 1);
      reorderedPages.splice(destinationIndex, 0, removed);
      setPages(reorderedPages);
    } else if (result.type === "section") {
      const pageId = result.source.droppableId.replace("sections-", "");
      const pageIndex = pages.findIndex((p) => p.id === pageId);

      if (pageIndex !== -1) {
        const newPages = [...pages];
        const pageSections = [...newPages[pageIndex].sections];
        const [removed] = pageSections.splice(sourceIndex, 1);
        pageSections.splice(destinationIndex, 0, removed);
        newPages[pageIndex].sections = pageSections;
        setPages(newPages);
      }
    }
  };

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
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="pages" type="page">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {pages.map((page, index) => (
                  <Draggable key={page.id} draggableId={page.id} index={index}>
                    {(provided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center">
                            <div
                              {...provided.dragHandleProps}
                              className="mr-2 cursor-grab"
                            >
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-grow">
                              <CardTitle>{page.title}</CardTitle>
                              <CardDescription>
                                {page.description}
                              </CardDescription>
                            </div>
                            <div className="flex space-x-2">
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
                          <h4 className="text-sm font-medium mb-2">
                            Page Sections
                          </h4>
                          <Droppable
                            droppableId={`sections-${page.id}`}
                            type="section"
                          >
                            {(provided) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-2"
                              >
                                {page.sections.map((section, sectionIndex) => (
                                  <Draggable
                                    key={section.id}
                                    draggableId={section.id}
                                    index={sectionIndex}
                                  >
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="flex items-center p-2 bg-gray-50 rounded-md"
                                      >
                                        <div
                                          {...provided.dragHandleProps}
                                          className="mr-2 cursor-grab"
                                        >
                                          <GripVertical className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div className="flex-grow">
                                          <div className="font-medium text-sm">
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
                                          onClick={() =>
                                            handleEditSection(page.id, section)
                                          }
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-4 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Section
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <Button className="bg-[#f58327] hover:bg-[#f58327]/90 text-white">
        Save Page Structure
      </Button>
    </div>
  );
}
