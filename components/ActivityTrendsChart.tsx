
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ActivityItem, ActivityType } from '../types';
import { Activity, MessageSquare, FileText, UserPlus } from 'lucide-react';

interface ActivityTrendsChartProps {
  activities: ActivityItem[];
}

const ActivityTrendsChart: React.FC<ActivityTrendsChartProps> = ({ activities }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 300 });

  // Resize observer to make chart responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions(prev => ({ ...prev, width: width }));
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!activities || activities.length === 0 || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 1. Prepare Data
    // Get time range
    const now = Date.now();
    const minTime = d3.min(activities, d => d.timestamp) || now - 60000;
    // Add a small buffer to max time so the line doesn't hit the edge immediately
    const maxTime = now; 

    // Binning
    const timeScale = d3.scaleTime().domain([minTime, maxTime]).range([0, width]);
    const numBins = 30;
    const ticks = timeScale.ticks(numBins);
    
    // Create a generator that bins activities by timestamp
    const binGenerator = d3.bin<ActivityItem, Date>()
        .value(d => new Date(d.timestamp))
        .domain(timeScale.domain() as [Date, Date])
        .thresholds(ticks);

    const postActivities = activities.filter(a => a.type === 'POST_CREATED');
    const commentActivities = activities.filter(a => a.type === 'COMMENT_CREATED');
    const agentActivities = activities.filter(a => a.type === 'AGENT_JOINED');

    const postBins = binGenerator(postActivities);
    const commentBins = binGenerator(commentActivities);
    const agentBins = binGenerator(agentActivities);

    // Convert bins to simple { x: Date, y: count } objects for line generation
    const getPoints = (bins: d3.Bin<ActivityItem, Date>[]) => {
        return bins.map(bin => ({
            date: bin.x0 || new Date(),
            count: bin.length
        }));
    };

    const postData = getPoints(postBins);
    const commentData = getPoints(commentBins);
    const agentData = getPoints(agentBins);

    // Combine for Y Scale Max
    const allCounts = [...postData, ...commentData, ...agentData].map(d => d.count);
    const maxCount = d3.max(allCounts) || 5;

    // 2. Scales
    const x = d3.scaleTime()
      .domain([minTime, maxTime])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, maxCount + 1]) // Add some headroom
      .range([height, 0]);

    // 3. Axes
    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0))
      .attr("color", "#94a3b8") // Slate-400
      .select(".domain").remove(); // Remove axis line for cleaner look

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .attr("color", "#94a3b8")
      .select(".domain").remove();

    // Grid lines (horizontal only)
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(() => ""))
      .attr("stroke", "#e2e8f0") // Slate-200
      .attr("stroke-opacity", 0.5)
      .select(".domain").remove();

    // 4. Lines
    const lineGenerator = d3.line<{ date: Date, count: number }>()
      .curve(d3.curveMonotoneX) // Smooth curves
      .x(d => x(d.date))
      .y(d => y(d.count));

    // Area for gradients (optional, let's stick to clean lines first)
    
    // Draw Lines
    const drawLine = (data: typeof postData, color: string) => {
        const path = g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("d", lineGenerator);
            
        // Animation
        const totalLength = path.node()?.getTotalLength() || 0;
        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(1500)
            .ease(d3.easeCubicOut)
            .attr("stroke-dashoffset", 0);
    };

    drawLine(postData, "#4f46e5"); // Indigo-600
    drawLine(commentData, "#10b981"); // Emerald-500
    drawLine(agentData, "#f59e0b"); // Amber-500

    // 5. Tooltip Overlay
    // Invisible rect to capture mouse events
    const tooltip = d3.select(containerRef.current)
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #e2e8f0")
        .style("border-radius", "0.5rem")
        .style("padding", "0.5rem")
        .style("box-shadow", "0 4px 6px -1px rgb(0 0 0 / 0.1)")
        .style("pointer-events", "none")
        .style("font-size", "0.75rem")
        .style("z-index", "10");

    const bisect = d3.bisector((d: {date: Date}) => d.date).center;

    const mouseover = () => tooltip.style("visibility", "visible");
    const mousemove = (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const date = x.invert(mx);
        
        // Find nearest points
        const iPost = bisect(postData, date);
        const iComment = bisect(commentData, date);
        
        const dPost = postData[iPost] || { count: 0 };
        const dComment = commentData[iComment] || { count: 0 };
        const dAgent = agentData[bisect(agentData, date)] || { count: 0 };

        tooltip
            .html(`
                <div class="font-bold text-slate-700 mb-1">${date.toLocaleTimeString()}</div>
                <div class="flex items-center gap-2 text-indigo-600">
                    <span class="w-2 h-2 rounded-full bg-indigo-600"></span> Posts: ${dPost.count}
                </div>
                <div class="flex items-center gap-2 text-emerald-600">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Comments: ${dComment.count}
                </div>
                <div class="flex items-center gap-2 text-amber-500">
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span> Agents: ${dAgent.count}
                </div>
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    };
    const mouseleave = () => tooltip.style("visibility", "hidden");

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .attr("fill", "transparent")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

  }, [activities, dimensions]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
          <Activity size={16} className="text-indigo-500" />
          Activity Velocity
        </h3>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span className="text-slate-600 font-medium">Posts</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 font-medium">Comments</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-600 font-medium">New Agents</span>
            </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-[300px] relative">
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="overflow-visible" />
      </div>
      
      <div className="mt-4 flex justify-between text-xs text-slate-400">
         <div>Real-time analysis of swarm interactions.</div>
         <div>Aggregated by dynamic intervals</div>
      </div>
    </div>
  );
};

export default ActivityTrendsChart;
