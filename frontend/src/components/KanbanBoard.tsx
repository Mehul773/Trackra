import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { Job, JobStatus } from '../types';
import { JobCard } from './JobCard';
import { Circle, FileText, CalendarCheck, Award, ThumbsDown } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

interface KanbanBoardProps {
  jobs: Job[];
  onEditJob: (job: Job) => void;
  onDeleteJob: (id: string) => void;
  onViewJob: (job: Job) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
}

interface ColumnConfig {
  status: JobStatus;
  title: string;
  color: string;
  icon: React.ReactNode;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: JobStatus.NOT_APPLIED,
    title: 'Wishlist',
    color: 'column-not-applied',
    icon: <Circle size={14} />,
  },
  {
    status: JobStatus.APPLIED,
    title: 'Applied',
    color: 'column-applied',
    icon: <FileText size={14} />,
  },
  {
    status: JobStatus.INTERVIEW,
    title: 'Interviews',
    color: 'column-interview',
    icon: <CalendarCheck size={14} />,
  },
  {
    status: JobStatus.OFFER,
    title: 'Offers',
    color: 'column-offer',
    icon: <Award size={14} />,
  },
  {
    status: JobStatus.REJECTED,
    title: 'Rejected',
    color: 'column-rejected',
    icon: <ThumbsDown size={14} />,
  },
];

/**
 * Infinite scroll column — renders cards in chunks of ITEMS_PER_PAGE,
 * loading more when the user scrolls near the bottom.
 */
const InfiniteScrollColumn: React.FC<{
  col: ColumnConfig;
  colJobs: Job[];
  onEditJob: (job: Job) => void;
  onDeleteJob: (id: string) => void;
  onViewJob: (job: Job) => void;
}> = ({ col, colJobs, onEditJob, onDeleteJob, onViewJob }) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset visible count when jobs change (e.g. search filter)
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [colJobs.length]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Load more when user is within 100px of the bottom
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, colJobs.length));
    }
  }, [colJobs.length]);

  const visibleJobs = colJobs.slice(0, visibleCount);

  return (
    <Droppable droppableId={col.status}>
      {(provided, snapshot) => (
        <div
          className={`column-body${snapshot.isDraggingOver ? ' column-body--drag-over' : ''}`}
          ref={(el) => {
            provided.innerRef(el);
            (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }}
          {...provided.droppableProps}
          onScroll={handleScroll}
        >
          {visibleJobs.length > 0 ? (
            <div className="cards-stack">
              {visibleJobs.map((job, index) => (
                <Draggable key={job.id} draggableId={job.id} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                    >
                      <JobCard
                        job={job}
                        onEdit={onEditJob}
                        onDelete={onDeleteJob}
                        onClick={onViewJob}
                        isDragging={dragSnapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {visibleCount < colJobs.length && (
                <div className="load-more-indicator">
                  Loading {colJobs.length - visibleCount} more...
                </div>
              )}
            </div>
          ) : (
            <div className="empty-column-placeholder">
              <span>No applications</span>
            </div>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  jobs,
  onEditJob,
  onDeleteJob,
  onViewJob,
  onStatusChange,
}) => {
  // Mobile: active tab state
  const [activeTab, setActiveTab] = useState<JobStatus>(JobStatus.NOT_APPLIED);

  // Group jobs by status
  const getJobsForColumn = (status: JobStatus) => {
    return jobs.filter((job) => job.status === status);
  };

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStatus = destination.droppableId as JobStatus;
    // Only update if the status actually changed
    const job = jobs.find((j) => j.id === draggableId);
    if (job && job.status !== newStatus) {
      onStatusChange(draggableId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-container">
        {/* Mobile Tab Bar */}
        <div className="kanban-tabs">
          {COLUMNS.map((col) => {
            const count = getJobsForColumn(col.status).length;
            return (
              <button
                key={col.status}
                className={`kanban-tab ${col.color}${activeTab === col.status ? ' kanban-tab--active' : ''}`}
                onClick={() => setActiveTab(col.status)}
              >
                {col.icon}
                <span className="kanban-tab-label">{col.title}</span>
                <span className="kanban-tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop: All Columns */}
        <div className="kanban-grid">
          {COLUMNS.map((col) => {
            const colJobs = getJobsForColumn(col.status);
            const isActiveOnMobile = activeTab === col.status;
            return (
              <div
                key={col.status}
                className={`kanban-column${isActiveOnMobile ? ' kanban-column--active' : ''}`}
              >
                {/* Column Header */}
                <div className={`column-header ${col.color}`}>
                  <div className="header-title">
                    {col.icon}
                    <span>{col.title}</span>
                  </div>
                  <span className="job-count-badge">{colJobs.length}</span>
                </div>

                {/* Column Cards Container with Infinite Scroll */}
                <InfiniteScrollColumn
                  col={col}
                  colJobs={colJobs}
                  onEditJob={onEditJob}
                  onDeleteJob={onDeleteJob}
                  onViewJob={onViewJob}
                />
              </div>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
};
