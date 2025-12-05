

import React, { useRef, useState, useEffect } from 'react';
import { CatalogItem } from '../types';
import ModalShell from './ModalShell';
import { Button } from './ui/Button';
import { DocumentIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon, SpinnerIcon } from './Icons';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface ViewCatalogModalProps {
    catalog: CatalogItem[];
    accountId: string;
    onClose: () => void;
}

export const ViewCatalogModal: React.FC<ViewCatalogModalProps> = ({ catalog, accountId, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const activeItem = catalog[selectedIndex];
    const { incrementCatalogView, incrementCatalogDownload } = useAuth();

    // Track views when the item changes
    useEffect(() => {
        if (activeItem) {
            incrementCatalogView(accountId, activeItem.id);
        }
    }, [selectedIndex, activeItem, accountId, incrementCatalogView]);

    const isPdf = activeItem?.type === 'pdf';

    const handleDownload = async () => {
        if (!activeItem) return;
        
        setIsDownloading(true);
        incrementCatalogDownload(accountId, activeItem.id);
        
        try {
            // Attempt to fetch the file as a blob to force download
            const response = await fetch(activeItem.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = activeItem.name; // Forces download with the correct name
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download failed, using fallback", error);
            // Fallback to simple link click if fetch fails (e.g. CORS)
            const link = document.createElement('a');
            link.href = activeItem.url;
            link.download = activeItem.name;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setIsDownloading(false);
        }
    };

    const renderFooter = () => (
        <div className="flex justify-between w-full gap-2">
             <div className="flex gap-2">
                <Button 
                    variant="overlay-dark" 
                    size="icon-sm" 
                    onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                    disabled={selectedIndex === 0}
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </Button>
                <Button 
                    variant="overlay-dark" 
                    size="icon-sm" 
                    onClick={() => setSelectedIndex(prev => Math.min(catalog.length - 1, prev + 1))}
                    disabled={selectedIndex === catalog.length - 1}
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </Button>
             </div>
             <div className="flex gap-2">
                 <Button variant="overlay-dark" onClick={handleDownload} title="Download file" disabled={!activeItem || isDownloading}>
                    {isDownloading ? <SpinnerIcon className="w-5 h-5" /> : <ArrowDownTrayIcon className="w-5 h-5" />}
                    <span className="hidden sm:inline ml-2">{isDownloading ? 'Downloading...' : 'Download'}</span>
                 </Button>
                 <Button variant="overlay-dark" onClick={onClose}>Close</Button>
             </div>
        </div>
    );

    if (!activeItem) return null;

    return (
        <ModalShell
            panelRef={modalRef}
            onClose={onClose}
            title={activeItem.name}
            footer={renderFooter()}
            panelClassName="w-full max-w-6xl h-[95vh]"
            titleId="view-catalog-title"
        >
            <div className="flex flex-col h-full md:flex-row overflow-hidden">
                {/* Sidebar List for Desktop / Top bar for Mobile */}
                <div className="md:w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200 md:overflow-y-auto flex md:flex-col overflow-x-auto p-2 gap-2">
                    {catalog.map((item, index) => (
                        <Button
                            key={item.id}
                            onClick={() => setSelectedIndex(index)}
                            variant="ghost"
                            className={cn(
                                "justify-start h-auto p-2 rounded-md text-left w-full flex-shrink-0 gap-2",
                                selectedIndex === index ? "bg-white ring-1 ring-gray-200" : ""
                            )}
                        >
                            {item.type === 'image' ? (
                                <img src={item.url} alt="" className="w-10 h-10 object-cover rounded bg-gray-200 flex-shrink-0" />
                            ) : (
                                <div className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded flex-shrink-0">
                                    <DocumentIcon className="w-5 h-5" />
                                </div>
                            )}
                            <span className={cn("text-sm truncate max-w-[120px]", selectedIndex === index ? "font-semibold text-gray-900" : "text-gray-600")}>
                                {item.name}
                            </span>
                        </Button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-gray-100 p-4 flex items-center justify-center overflow-hidden relative">
                    {isPdf ? (
                        <iframe src={activeItem.url} className="w-full h-full rounded-md border border-gray-200 bg-white" title={activeItem.name} />
                    ) : (
                        <img src={activeItem.url} alt={activeItem.name} className="max-w-full max-h-full object-contain rounded-md" />
                    )}
                </div>
            </div>
        </ModalShell>
    );
};